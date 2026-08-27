/**
 * MapControls.jsx — the floating zoom in/out + recenter buttons
 * shown in the bottom-right corner. Click handlers are simple
 * wrappers around the live map instance via useMap.
 */
import React from "react";
import { useMap } from "react-leaflet";
import { Plus, Minus, Crosshair } from "lucide-react";
import { MAP_CENTER } from "../../utils/leafletConfig";

const MapControls = () => {
  const map = useMap();

  const zoomIn = () => {
    try { map.zoomIn(); } catch (_) { /* noop */ }
  };
  const zoomOut = () => {
    try { map.zoomOut(); } catch (_) { /* noop */ }
  };
  const recenter = () => {
    try { map.flyTo(MAP_CENTER, 4, { duration: 0.6 }); } catch (_) { /* noop */ }
  };

  return (
    <div className="gm-map-controls" aria-label="Controlos do mapa">
      <button
        type="button"
        className="gm-map-controls__btn"
        onClick={zoomIn}
        aria-label="Aumentar zoom"
      >
        <Plus size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        className="gm-map-controls__btn"
        onClick={zoomOut}
        aria-label="Diminuir zoom"
      >
        <Minus size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        className="gm-map-controls__btn gm-map-controls__btn--recenter"
        onClick={recenter}
        aria-label="Recentrar mapa"
        title="Recentrar"
      >
        <Crosshair size={14} strokeWidth={2} />
      </button>
    </div>
  );
};

export default MapControls;
