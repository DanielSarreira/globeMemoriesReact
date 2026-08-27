/**
 * MapFAB.jsx — the floating action button shown only on mobile
 * (hidden on desktop, where the side panel handles the same role).
 * Tapping it opens the bottom sheet.
 */
import React from "react";
import { Globe2 } from "lucide-react";

const MapFAB = ({ onClick }) => (
  <button
    type="button"
    className="gm-map-fab"
    aria-label="Explorar mapa"
    onClick={onClick}
  >
    <Globe2 size={22} strokeWidth={1.75} />
  </button>
);

export default MapFAB;
