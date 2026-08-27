/**
 * VisitedCountriesLayer.jsx — the Fog of War overlay.
 *
 * Visual contract:
 *   • Unvisited countries: desaturated slate fill (55% opacity)
 *     with a soft outline. They look "undiscovered" but stay
 *     visible — the world is never hidden.
 *   • Visited countries: fully transparent. The basemap tile
 *     shows through with its full colour.
 *   • Pulse: when a country transitions unvisited → visited, we
 *     add a 1.8s brand-blue pulse animation to draw the eye.
 *
 * The country→ISO3 conversion happens via utils/countryIso so
 * matching is language-agnostic.
 *
 * Performance notes:
 *   • GeoJSON is fetched once and cached in sessionStorage for 7
 *     days.
 *   • The L.geoJSON layer is recreated only when (map, mode,
 *     geoData) change — not on every visitedCountries update.
 *   • The style callback reads the visited sets via refs so a
 *     new visitedCountries value doesn't recreate the layer.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { countriesToIso3Set } from "../../../utils/countryIso";
import { PANE, FOG_PANE_ZINDEX } from "../utils/leafletConfig";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const CACHE_KEY = "gm-fog-of-war-geojson-v3";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PULSE_DURATION_MS = 1800;

const UNVISITED_STYLE = {
  // Slate-800 fill (was slate-600) — user asked to darken this
  // so unvisited countries read clearly as "still to discover".
  fillColor: "#1e293b",
  // Slate-600 outline (was slate-400) so the borders stay
  // visible against the darker fill without competing with it.
  color: "#475569",
  opacity: 0.7,
  weight: 0.5,
  fillOpacity: 0.7,
  interactive: false,
};

const VISITED_STYLE = {
  fillColor: "#000000",
  color: "#000000",
  opacity: 0,
  weight: 0,
  fillOpacity: 0,
  interactive: false,
};

/** Diff two ISO3 sets to find countries that just transitioned
 *  unvisited → visited. Returns an array of country names (the
 *  `name` field from the GeoJSON) for the pulse class to match. */
function findNewlyVisited(features, prevIso3, nextIso3) {
  if (prevIso3.size === 0) return []; // first paint — skip pulse
  const out = [];
  features.forEach((f) => {
    const props = (f && f.properties) || {};
    const iso3 = props["ISO3166-1-Alpha-3"];
    const name = (props.name || "").toString().toLowerCase();
    if (!iso3 || iso3 === "-99") return;
    if (!prevIso3.has(iso3) && nextIso3.has(iso3)) {
      out.push(name);
    }
  });
  return out;
}

/** Apply the pulse class to the SVG paths whose feature name is
 *  in the `names` set; remove the class after the animation. */
function applyPulse(layer, names) {
  if (!layer || names.length === 0) return;
  setTimeout(() => {
    const target = new Set(names);
    const container = layer.getContainer && layer.getContainer();
    if (!container) return;
    container.querySelectorAll("path").forEach((node) => {
      const d = node.__feature__ && node.__feature__.properties;
      if (!d) return;
      const name = (d.name || "").toString().toLowerCase();
      if (target.has(name)) {
        node.classList.add("gm-fog__discovered");
        setTimeout(() => node.classList.remove("gm-fog__discovered"), PULSE_DURATION_MS);
      }
    });
  }, 60);
}

const VisitedCountriesLayer = ({ visitedCountries, mode, opacity = 0.55 }) => {
  const map = useMap();
  const [geoData, setGeoData] = useState(null);
  const overlayRef = useRef(null);
  const paneRef = useRef(null);
  const prevIso3Ref = useRef(new Set());
  // Round 74 — Tracks the last visitedIso3 we rebuilt the layer
  // for, so we can skip the redundant rebuild on the very first
  // effect tick after the layer was just created by useEffect #3
  // (both effects fire in the same commit when the GeoJSON
  // resolves for the first time).
  const lastRebuildIso3Ref = useRef(null);

  const visitedIso3 = useMemo(
    () => countriesToIso3Set(visitedCountries),
    [visitedCountries],
  );

  // Refs so the style callback always reads the latest data without
  // re-creating the L.geoJSON layer.
  const visitedIso3Ref = useRef(visitedIso3);
  visitedIso3Ref.current = visitedIso3;

  // Fallback: a Set of normalized country names (used when the
  // GeoJSON feature has no ISO3 code, e.g. Somaliland).
  const visitedNames = useMemo(() => {
    const s = new Set();
    (visitedCountries || []).forEach((c) => {
      if (c) s.add(c.toString().toLowerCase().trim());
    });
    return s;
  }, [visitedCountries]);
  const visitedNamesRef = useRef(visitedNames);
  visitedNamesRef.current = visitedNames;

  // 1. Custom Leaflet pane (above tiles, below markers)
  useEffect(() => {
    if (!map || mode !== "mine") return;
    if (!paneRef.current) {
      const pane = map.createPane(PANE.FOG);
      pane.style.zIndex = FOG_PANE_ZINDEX;
      pane.style.pointerEvents = "none";
      paneRef.current = pane;
    }
    return undefined;
  }, [map, mode]);

  // 2. Fetch GeoJSON (with sessionStorage cache)
  useEffect(() => {
    let cancelled = false;

    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (
          cached && cached.ts &&
          Date.now() - cached.ts < CACHE_TTL_MS &&
          cached.data
        ) {
          if (!cancelled) setGeoData(cached.data);
          return undefined;
        }
      }
    } catch (_) {
      /* ignore */
    }

    fetch(GEOJSON_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setGeoData(data);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
        } catch (_) {
          /* quota — ignore */
        }
      })
      .catch(() => {
        if (!cancelled) setGeoData(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 3. Render the L.geoJSON layer (only when map / geoData / mode change)
  useEffect(() => {
    if (!map) return undefined;
    if (mode !== "mine") {
      if (overlayRef.current) {
        try { map.removeLayer(overlayRef.current); } catch (_) { /* noop */ }
        overlayRef.current = null;
      }
      return undefined;
    }
    if (!geoData) return undefined;

    const features = Array.isArray(geoData.features) ? geoData.features : [];

    const layer = L.geoJSON(
      { type: "FeatureCollection", features },
      {
        pane: PANE.FOG,
        renderer: L.svg({ padding: 0.5 }),
        style: (feature) => {
          const props = (feature && feature.properties) || {};
          const iso3 = props["ISO3166-1-Alpha-3"];
          const nameEn = props.name || props.NAME || props.NAME_LONG;
          const normName = nameEn ? nameEn.toString().toLowerCase().trim() : "";

          // ISO3 is the primary match. If the feature has no valid
          // ISO3 (e.g. `-99` for disputed territories), fall back to
          // a name match — never both, and never the tautology check
          // we had before (which cleared every country).
          let visited = false;
          if (iso3 && iso3 !== "-99") {
            visited = visitedIso3Ref.current.has(iso3);
          } else if (normName) {
            visited = visitedNamesRef.current.has(normName);
          }

          if (visited) {
            return { ...VISITED_STYLE, className: "gm-fog__cleared" };
          }
          return {
            ...UNVISITED_STYLE,
            fillOpacity: opacity,
            className: "gm-fog__hidden",
          };
        },
        onEachFeature: (feature, lyr) => {
          if (lyr && lyr.getElement) {
            const el = lyr.getElement();
            if (el) el.__feature__ = feature;
          }
        },
      },
    );
    layer.addTo(map);
    overlayRef.current = layer;
    // Round 74 — Mark this build as the latest visited set so
    // useEffect #4 doesn't immediately rebuild in the same
    // commit. Both effects fire in the same render cycle when
    // the GeoJSON resolves for the first time.
    lastRebuildIso3Ref.current = visitedIso3Ref.current;

    // Pulse countries that just became visited.
    const newlyVisited = findNewlyVisited(
      features,
      prevIso3Ref.current,
      visitedIso3Ref.current,
    );
    prevIso3Ref.current = new Set(visitedIso3Ref.current);
    if (newlyVisited.length > 0) {
      applyPulse(layer, newlyVisited);
    }

    // Keep the fog above tiles but below markers after any map
    // mutation that could re-stack panes.
    const refresh = () => {
      try {
        const pane = map.getPane(PANE.FOG);
        if (pane) pane.style.zIndex = FOG_PANE_ZINDEX;
      } catch (_) {
        /* noop */
      }
    };
    map.on("moveend", refresh);
    map.on("zoomend", refresh);
    map.on("layeradd", refresh);
    map.on("resize", refresh);

    return () => {
      if (overlayRef.current) {
        try { map.removeLayer(overlayRef.current); } catch (_) { /* noop */ }
        overlayRef.current = null;
      }
      try {
        map.off("moveend", refresh);
        map.off("zoomend", refresh);
        map.off("layeradd", refresh);
        map.off("resize", refresh);
      } catch (_) {
        /* noop */
      }
    };
  }, [map, geoData, mode, opacity]);

  // 4. Re-style the existing layer when the visited set changes.
  //    Round 74 — The previous implementation called
  //    `layer.eachLayer((lyr) => lyr.setStyle(...))`, but
  //    Leaflet's SVG renderer has a known issue where setStyle
  //    on already-rendered paths doesn't always re-apply the
  //    new fillOpacity / fillColor immediately (the renderer
  //    caches the style and only re-applies on zoom/redraw).
  //    Symptom: when the user opens /interactive-map for the
  //    first time and the trips load AFTER the GeoJSON fetch
  //    resolves, the fog stays dark on every country until
  //    the user clicks "Comunidade" and comes back (which
  //    unmounts and remounts the layer, forcing a fresh
  //    paint). The fix is to FORCE a full layer rebuild when
  //    the visited set changes — drop the existing layer and
  //    create a new one. The pulse class and the `prevIso3Ref`
  //    diff are kept intact so the discovered animation still
  //    plays when a new country transitions unvisited →
  //    visited.
  useEffect(() => {
    const map_ = map;
    if (!map_) return;
    if (mode !== "mine") return;
    if (!geoData) return;
    if (!overlayRef.current) return; // layer not created yet — #3 will handle it

    // Round 74 — Detect the very first run after the layer
    // was just built (useEffect #3 fired and set
    // `overlayRef.current` to the new layer in the same tick
    // as this effect). In that case, the layer is already
    // styled with the right visited set, so we just need to
    // skip the rebuild.
    if (lastRebuildIso3Ref.current === visitedIso3) return;

    const features = Array.isArray(geoData.features) ? geoData.features : [];
    const prevIso3 = prevIso3Ref.current;
    const newlyVisited = findNewlyVisited(features, prevIso3, visitedIso3);

    // Tear down the existing layer and build a new one. The
    // new layer reads `visitedIso3Ref.current` (which is
    // always the latest) via the style callback, so visited
    // countries get the cleared style on the first paint.
    try { map_.removeLayer(overlayRef.current); } catch (_) { /* noop */ }
    overlayRef.current = null;

    const layer = L.geoJSON(
      { type: "FeatureCollection", features },
      {
        pane: PANE.FOG,
        renderer: L.svg({ padding: 0.5 }),
        style: (feature) => {
          const props = (feature && feature.properties) || {};
          const iso3 = props["ISO3166-1-Alpha-3"];
          const nameEn = props.name || props.NAME || props.NAME_LONG;
          const normName = nameEn ? nameEn.toString().toLowerCase().trim() : "";

          let visited = false;
          if (iso3 && iso3 !== "-99") {
            visited = visitedIso3Ref.current.has(iso3);
          } else if (normName) {
            visited = visitedNamesRef.current.has(normName);
          }

          if (visited) {
            return { ...VISITED_STYLE, className: "gm-fog__cleared" };
          }
          return {
            ...UNVISITED_STYLE,
            fillOpacity: opacity,
            className: "gm-fog__hidden",
          };
        },
        onEachFeature: (feature, lyr) => {
          if (lyr && lyr.getElement) {
            const el = lyr.getElement();
            if (el) el.__feature__ = feature;
          }
        },
      },
    );
    layer.addTo(map_);
    overlayRef.current = layer;
    lastRebuildIso3Ref.current = visitedIso3;
    prevIso3Ref.current = new Set(visitedIso3);

    if (newlyVisited.length > 0) {
      applyPulse(layer, newlyVisited);
    }

    // Keep the fog above tiles but below markers after any map
    // mutation that could re-stack panes.
    const refresh = () => {
      try {
        const pane = map_.getPane(PANE.FOG);
        if (pane) pane.style.zIndex = FOG_PANE_ZINDEX;
      } catch (_) {
        /* noop */
      }
    };
    map_.on("moveend", refresh);
    map_.on("zoomend", refresh);
    map_.on("layeradd", refresh);
    map_.on("resize", refresh);

    return () => {
      if (overlayRef.current) {
        try { map_.removeLayer(overlayRef.current); } catch (_) { /* noop */ }
        overlayRef.current = null;
      }
      try {
        map_.off("moveend", refresh);
        map_.off("zoomend", refresh);
        map_.off("layeradd", refresh);
        map_.off("resize", refresh);
      } catch (_) {
        /* noop */
      }
    };
  }, [visitedIso3, visitedNames, opacity, mode, geoData, map]);

  return null;
};

export default VisitedCountriesLayer;
