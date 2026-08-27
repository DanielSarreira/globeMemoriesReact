/**
 * MapFilters.jsx — the filter chips shown only in "Comunidade" mode.
 * Lets the user toggle the "A seguir" and "Públicas" sub-filters.
 */
import React from "react";
import { COMMUNITY_FILTERS } from "../../utils/constants";

const MapFilters = ({ filters, onToggle }) => (
  <div className="gm-filters">
    {COMMUNITY_FILTERS.map((f) => (
      <button
        key={f.id}
        type="button"
        className={`gm-filters__chip ${filters[f.id] ? "gm-filters__chip--active" : ""}`}
        onClick={() => onToggle(f.id)}
        aria-pressed={filters[f.id]}
      >
        {f.label}
      </button>
    ))}
  </div>
);

export default MapFilters;
