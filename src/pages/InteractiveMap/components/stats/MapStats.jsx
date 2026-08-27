/**
 * MapStats.jsx — the "Mundo explorado X / 195" discovery widget.
 * Shown only in the "Minhas" tab.
 *
 * The progress bar is brand-blue with a soft glow. The percentage
 * is computed to 1 decimal place and shown on the right.
 */
import React from "react";
import { Globe2 } from "lucide-react";

const MapStats = ({ visited, total, percent }) => {
  const width = Math.min(100, percent || 0);
  return (
    <div className="gm-map-stats" aria-label="Progresso de descoberta">
      <div className="gm-map-stats__row">
        <Globe2 size={14} strokeWidth={1.75} className="gm-map-stats__icon" />
        <span className="gm-map-stats__label">Mundo explorado</span>
      </div>
      <div className="gm-map-stats__numbers">
        <span className="gm-map-stats__count">
          {visited} <span className="gm-map-stats__sep">/</span> {total}
        </span>
        <span className="gm-map-stats__percent">{percent}%</span>
      </div>
      <div
        className="gm-map-stats__bar"
        role="progressbar"
        aria-valuenow={visited}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div className="gm-map-stats__bar-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

export default MapStats;
