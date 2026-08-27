/**
 * MapLayerSwitch.jsx — the row of basemap layer buttons (Básico,
 * Ruas, Terreno, Satélite). Renders the same component for both
 * desktop panel and mobile sheet.
 */
import React from "react";
import { LAYERS } from "../../utils/constants";

const MapLayerSwitch = ({ active, onChange }) => (
  <div className="gm-layer-switch" role="radiogroup" aria-label="Camada do mapa">
    {LAYERS.map((layer) => {
      const Icon = layer.icon;
      const isActive = active === layer.id;
      return (
        <button
          key={layer.id}
          type="button"
          role="radio"
          aria-checked={isActive}
          className={`gm-layer-switch__btn ${isActive ? "gm-layer-switch__btn--active" : ""}`}
          onClick={() => onChange(layer.id)}
        >
          <Icon size={13} strokeWidth={1.75} />
          <span>{layer.label}</span>
        </button>
      );
    })}
  </div>
);

export default MapLayerSwitch;
