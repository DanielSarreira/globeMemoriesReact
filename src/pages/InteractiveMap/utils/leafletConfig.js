/**
 * leafletConfig.js — single source of truth for every Leaflet option
 * used by the Interactive Map page. NOTHING in any other file should
 * hard-code map options; everyone spreads or reads from here.
 *
 * The values below were chosen and battle-tested across Round 40+:
 *   • minZoom 2 / maxZoom 8 — no pixelated tiles, no "infinite" world.
 *   • center [20, 0] / zoom 6 — opens "two zoom-ins in" from the world
 *     overview (zoom 2), fills a 16:9 viewport edge-to-edge without
 *     black bars or white slivers.
 *   • worldCopyJump: false, noWrap: true, maxBounds finite
 *     (±85.0511287798, ±180) — the single flags that stop the world
 *     from being drawn multiple times.
 *   • fadeAnimation / zoomAnimation / markerZoomAnimation: false —
 *     these are the FIX for the "quadrados during zoom" flicker
 *     (Leaflet hides tiles during animation by default, leaving
 *     white squares in the gap).
 *   • bounceAtZoomLimits: true — the map "bounces" against the
 *     min/max zoom limits instead of stopping dead, which is the
 *     feel the user asked for ("não deve fazer scroll out até um
 *     limite").
 */
import L from "leaflet";

export const MAP_BOUNDS = Object.freeze([
  [-85.0511287798, -180],
  [85.0511287798, 180],
]);

export const MAP_CENTER = Object.freeze([20, 0]);
// Round 40+ — "Two zoom-ins from the default" landed at zoom 6
// originally, but the user feedback is that the resulting viewport
// felt too cropped (no whole-world context). Zoom 4 helped, then
// 2.5 ("a bit more zoom out"), then back up to 3 ("a bit more
// zoom in"). 3 is the new sweet spot: the world still fits a
// 16:9 viewport edge-to-edge (no preto slivers), countries are
// still clearly readable, and the world feels "closer" than 2.5
// without feeling cropped like 4. MAP_MIN_ZOOM is pinned to
// MAP_INITIAL_ZOOM so the user can NOT zoom out beyond the
// initial state.
export const MAP_INITIAL_ZOOM = 3;
export const MAP_MIN_ZOOM = MAP_INITIAL_ZOOM;
export const MAP_MAX_ZOOM = 8;

/** Options passed straight to <MapContainer />. */
export const mapContainerOptions = Object.freeze({
  center: MAP_CENTER,
  zoom: MAP_INITIAL_ZOOM,
  minZoom: MAP_MIN_ZOOM,
  maxZoom: MAP_MAX_ZOOM,
  maxBounds: MAP_BOUNDS,
  maxBoundsViscosity: 1.0,
  worldCopyJump: false,
  fadeAnimation: false,
  zoomAnimation: false,
  markerZoomAnimation: false,
  bounceAtZoomLimits: true,
  inertia: true,
  smoothWheelZoom: true,
  wheelDebounceTime: 40,
  wheelPxPerZoomLevel: 80,
  zoomSnap: 0.5,
  zoomDelta: 0.5,
  zoomControl: false,
});

/** Options passed to <TileLayer />. The `key` is supplied by the
 *  parent so a layer switch remounts the tiles cleanly. */
export const tileLayerBaseOptions = Object.freeze({
  noWrap: true,
  bounds: MAP_BOUNDS,
  minZoom: MAP_MIN_ZOOM,
  maxZoom: MAP_MAX_ZOOM,
  keepBuffer: 3,
  updateWhenZooming: true,
  updateInterval: 200,
});

/** MapTiler API key. Hard-coded for now; in production this would
 *  come from an env var injected at build time. */
export const MAPTILER_API_KEY = "G59o5q9sfWGLLQJsw3v7";

export const MAP_LAYERS = Object.freeze({
  basic: {
    id: "basic",
    label: "Básico",
    url: `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
  },
  streets: {
    id: "streets",
    label: "Ruas",
    url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
  },
  terrain: {
    id: "terrain",
    label: "Terreno",
    url: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
  },
  satellite: {
    id: "satellite",
    label: "Satélite",
    url: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`,
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
  },
});

/** Leaflet pane names. Centralised so we don't typo them. */
export const PANE = Object.freeze({
  TILE: "tilePane",
  OVERLAY: "overlayPane",
  MARKER: "markerPane",
  POPUP: "popupPane",
  TOOLTIP: "tooltipPane",
  FOG: "gm-fog-pane",
});

/** z-index for the Fog of War pane. The marker-pane has 1000 in
 *  CSS, so 401 keeps the fog well below the pins. */
export const FOG_PANE_ZINDEX = 401;

/** Background color of the map container — used for the "no tiles
 *  yet" placeholder AND for the empty area outside the world
 *  bounds. We deliberately picked a light cyan so any gap (when
 *  the world is smaller than the viewport, e.g. at zoom 2.5 on
 *  ultra-wide monitors) reads as "ocean" instead of the old
 *  dark navy "preto" the user complained about. Matches the
 *  MapTiler "basic" ocean palette. */
export const MAP_BACKGROUND = "#cee9e6";

/** Default Leaflet DivIcon options. */
export const ICON_SIZE = Object.freeze([32, 40]);
export const ICON_ANCHOR = Object.freeze([16, 40]);
export const POPUP_ANCHOR = Object.freeze([0, -42]);

export default {
  MAP_BOUNDS,
  MAP_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  mapContainerOptions,
  tileLayerBaseOptions,
  MAPTILER_API_KEY,
  MAP_LAYERS,
  PANE,
  FOG_PANE_ZINDEX,
  MAP_BACKGROUND,
  ICON_SIZE,
  ICON_ANCHOR,
  POPUP_ANCHOR,
};

// Re-export Leaflet so callers can `import L from "./leafletConfig"`.
export { L };
