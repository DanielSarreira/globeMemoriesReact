/**
 * useTripIcon.js — memoised factory for Leaflet DivIcons. Returns
 * a stable icon per (color, type) pair. The factory is called once
 * per (color, type) and the result is cached for the lifetime of
 * the page — so 200 markers re-using the same icon don't re-create
 * 200 DivIcon instances.
 */
import { useMemo } from "react";
import L from "leaflet";
import { ICON_SIZE, ICON_ANCHOR, POPUP_ANCHOR } from "../utils/leafletConfig";

const ICON_GLYPH = {
  visited: "✈",
  following: "♥",
  public: "★",
  search: "◉",
};

const cache = new Map();

function buildIcon(color, type) {
  const key = `${color}|${type}`;
  if (cache.has(key)) return cache.get(key);

  const glyph = ICON_GLYPH[type] || "◉";
  const html = `
    <div class="gm-trip-marker" style="--gm-marker-color: ${color};">
      <div class="gm-trip-marker__shadow"></div>
      <div class="gm-trip-marker__body">
        <div class="gm-trip-marker__inner">
          <span class="gm-trip-marker__glyph">${glyph}</span>
        </div>
        <div class="gm-trip-marker__tip"></div>
      </div>
    </div>
  `;

  const icon = new L.DivIcon({
    html,
    className: "gm-trip-marker-container",
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
  });

  cache.set(key, icon);
  return icon;
}

export function useTripIcon(color, type) {
  return useMemo(() => buildIcon(color, type), [color, type]);
}
