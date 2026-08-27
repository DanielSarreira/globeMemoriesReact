/**
 * useMapInstance.js — gives a stable ref + helpers around the
 * Leaflet map. Used by MapCanvas, MapController, and the
 * MapResizeGuard.
 *
 * Returns:
 *   • mapRef — pass to <MapContainer ref={...} />
 *   • invalidate — manually call map.invalidateSize()
 *   • flyTo(latlng, zoom) — animated fly-to a coordinate
 *   • setView(latlng, zoom) — instant set-view
 *   • getMap() — read the current map (null if not mounted)
 */
import { useCallback, useRef } from "react";
import { useMap } from "react-leaflet";

/** A component that lives inside <MapContainer> and exposes the
 *  map instance to the parent via the shared ref. */
export function MapInstanceBridge({ mapRef }) {
  const map = useMap();
  mapRef.current = map;
  return null;
}

export function useMapInstance() {
  const mapRef = useRef(null);

  const invalidate = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.invalidateSize({ animate: false, pan: false });
    } catch (_) {
      /* noop */
    }
  }, []);

  const flyTo = useCallback((coords, zoom) => {
    const map = mapRef.current;
    if (!map || !coords) return;
    try {
      map.flyTo(coords, zoom, { duration: 1 });
    } catch (_) {
      /* noop */
    }
  }, []);

  const setView = useCallback((coords, zoom) => {
    const map = mapRef.current;
    if (!map || !coords) return;
    try {
      map.setView(coords, zoom, { animate: false });
    } catch (_) {
      /* noop */
    }
  }, []);

  return { mapRef, invalidate, flyTo, setView, getMap: () => mapRef.current };
}
