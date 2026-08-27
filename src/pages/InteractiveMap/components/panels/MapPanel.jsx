/**
 * MapPanel.jsx — the desktop sidebar (top-left, below the global
 * Sidebar). Hosts the header, discovery stats, mode switch,
 * search, filters, layer switch, and the magic button.
 *
 * Mobile renders <MapBottomSheet /> instead. This component
 * intentionally lives in the desktop-only branch.
 */
import React, { useState } from "react";
import { Globe2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import MapStats from "../stats/MapStats";
import MapModeSwitch from "./MapModeSwitch";
import MapFilters from "./MapFilters";
import MapSearch from "./MapSearch";
import MapLayerSwitch from "../map/MapLayerSwitch";

const MapPanel = ({
  collapsed,
  onToggleCollapse,
  mode,
  counts,
  discovery,
  search,
  filters,
  onModeChange,
  onFilterToggle,
  onSearchQuery,
  onSearchSelect,
  onSearchClear,
  activeLayer,
  onLayerChange,
  onMagicClick,
  isArrowFlying,
}) => {
  if (collapsed) {
    return (
      <aside className="gm-map-panel gm-map-panel--collapsed">
        <button
          type="button"
          className="gm-map-panel__toggle"
          onClick={onToggleCollapse}
          aria-label="Expandir painel"
        >
          <Globe2 size={18} strokeWidth={1.75} />
          <ArrowDown size={12} strokeWidth={1.75} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="gm-map-panel">
      <div className="gm-map-panel__head">
        <div className="gm-map-panel__head-icon">
          <Globe2 size={18} strokeWidth={1.75} />
        </div>
        <div className="gm-map-panel__head-info">
          <span className="gm-map-panel__head-title">Explorar</span>
          <span className="gm-map-panel__head-sub">
            {mode === "mine"
              ? `${counts.visited} viagens tuas`
              : `${counts.community} da comunidade`}
          </span>
        </div>
        <button
          type="button"
          className="gm-map-panel__toggle"
          aria-label="Recolher painel"
          onClick={onToggleCollapse}
        >
          <ArrowUp size={12} strokeWidth={1.75} />
        </button>
      </div>

      {mode === "mine" && (
        <MapStats
          visited={discovery.visited}
          total={discovery.total}
          percent={discovery.percent}
        />
      )}

      <div className="gm-map-panel__body">
        <MapModeSwitch mode={mode} onChange={onModeChange} counts={counts} />

        {mode === "community" && (
          <MapFilters filters={filters} onToggle={onFilterToggle} />
        )}

        <MapSearch
          query={search.query}
          results={search.results}
          loading={search.loading}
          onQueryChange={onSearchQuery}
          onSelect={onSearchSelect}
          onClear={onSearchClear}
        />

        <MapLayerSwitch active={activeLayer} onChange={onLayerChange} />

        <button
          type="button"
          className={`gm-magic-btn ${isArrowFlying ? "gm-magic-btn--flying" : ""}`}
          onClick={onMagicClick}
          disabled={isArrowFlying}
        >
          <Sparkles size={14} strokeWidth={1.75} />
          <span>{isArrowFlying ? "A procurar…" : "Destino surpresa"}</span>
        </button>
      </div>
    </aside>
  );
};

export default MapPanel;
