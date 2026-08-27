/**
 * TripMarker.jsx — a single marker on the map. Wraps react-leaflet's
 * <Marker /> and renders a <Popup /> with the trip details. Pure
 * presentational: receives a normalised trip + an icon, renders.
 *
 * Wrapped in React.memo so 200 markers don't re-render when the
 * page state changes (only the marker that gained/los t coordinates
 * re-renders).
 */
import React, { memo } from "react";
import { Marker, Popup } from "react-leaflet";
import TripPopup from "../popups/TripPopup";

const TripMarker = memo(function TripMarker({ trip, icon }) {
  if (!trip || !Array.isArray(trip.coordinates)) return null;
  const [lat, lng] = trip.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup>
        <TripPopup trip={trip} />
      </Popup>
    </Marker>
  );
}, (prev, next) => {
  // Re-render only when the trip's coordinates, photo, or title
  // change. This is the hot path (200 markers per render otherwise).
  const a = prev.trip;
  const b = next.trip;
  if (a === b) return prev.icon === next.icon;
  if (!a || !b) return false;
  if (a.id !== b.id) return false;
  if (a.coordinates !== b.coordinates) return false;
  if (a.tripPhoto !== b.tripPhoto) return false;
  if (a.title !== b.title) return false;
  if (a.city !== b.city) return false;
  if (a.country !== b.country) return false;
  return prev.icon === next.icon;
});

export default TripMarker;
