/**
 * MapModeSwitch.jsx — the two-tab "Minhas / Comunidade" switch.
 * Shared between desktop panel and mobile bottom sheet.
 */
import React from "react";
import { MapPin, Globe2 } from "lucide-react";

const MapModeSwitch = ({ mode, onChange, counts }) => {
  const visited = counts?.visited ?? 0;
  const community = counts?.community ?? 0;

  return (
    <div className="gm-mode-switch" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "mine"}
        className={`gm-mode-switch__btn ${mode === "mine" ? "gm-mode-switch__btn--active" : ""}`}
        onClick={() => onChange("mine")}
      >
        <MapPin size={14} strokeWidth={1.75} />
        <span>Minhas</span>
        {visited > 0 && <span className="gm-mode-switch__count">{visited}</span>}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "community"}
        className={`gm-mode-switch__btn ${mode === "community" ? "gm-mode-switch__btn--active" : ""}`}
        onClick={() => onChange("community")}
      >
        <Globe2 size={14} strokeWidth={1.75} />
        <span>Comunidade</span>
        {community > 0 && <span className="gm-mode-switch__count">{community}</span>}
      </button>
    </div>
  );
};

export default MapModeSwitch;
