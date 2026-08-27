/**
 * MapBottomSheet.jsx — the mobile-only bottom sheet. Anchored to
 * the bottom of the screen, centered, compact, opens via the FAB.
 *
 * Uses the shared <Sheet /> component from /components/ui for the
 * chrome (overlay, close button, focus trap) and renders the same
 * controls as the desktop panel.
 */
import React from "react";
import { Sparkles } from "lucide-react";
import { Sheet } from "../../../../components/ui";
import MapStats from "../stats/MapStats";
import MapModeSwitch from "./MapModeSwitch";
import MapFilters from "./MapFilters";
import MapLayerSwitch from "../map/MapLayerSwitch";

const MapBottomSheet = ({
  open,
  onClose,
  mode,
  counts,
  discovery,
  filters,
  onModeChange,
  onFilterToggle,
  activeLayer,
  onLayerChange,
  onMagicClick,
  isArrowFlying,
}) => {
  return (
    <Sheet
      title="Explorar mapa"
      open={open}
      onClose={onClose}
    >
      <div className="gm-sheet__content">
        {mode === "mine" && (
          <div className="gm-sheet__section">
            <MapStats
              visited={discovery.visited}
              total={discovery.total}
              percent={discovery.percent}
            />
          </div>
        )}

        <div className="gm-sheet__section">
          <div className="gm-sheet__label">Fonte</div>
          <MapModeSwitch mode={mode} onChange={onModeChange} counts={counts} />
        </div>

        {mode === "community" && (
          <div className="gm-sheet__section">
            <div className="gm-sheet__label">Filtros</div>
            <MapFilters filters={filters} onToggle={onFilterToggle} />
          </div>
        )}

        <div className="gm-sheet__section">
          <div className="gm-sheet__label">Camada do mapa</div>
          <MapLayerSwitch active={activeLayer} onChange={onLayerChange} />
        </div>

        <button
          type="button"
          className={`gm-magic-btn gm-magic-btn--full ${isArrowFlying ? "gm-magic-btn--flying" : ""}`}
          onClick={onMagicClick}
          disabled={isArrowFlying}
        >
          <Sparkles size={14} strokeWidth={1.75} />
          <span>{isArrowFlying ? "A procurar…" : "Destino surpresa"}</span>
        </button>
      </div>
    </Sheet>
  );
};

export default MapBottomSheet;
