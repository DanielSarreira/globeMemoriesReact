/**
 * TripPopup.jsx — content of a single trip marker's popup.
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │   [trip photo or gradient]  │
 *   │                             │
 *   │   Title                     │
 *   │   City, Country             │
 *   │   por @username             │
 *   │   12 Mai 2025 – 18 Mai 2025 │
 *   │   [   Ver viagem   ]        │
 *   └─────────────────────────────┘
 *
 * Image is lazy-loaded (`loading="lazy"`) — the page can have 200
 * popups queued; we don't want them all to download at once.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { toFullMediaUrl } from "../../../axios_helper";
import { Calendar, MapPin, User } from "lucide-react";

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (_) {
    return null;
  }
};

const TripPopup = ({ trip }) => {
  const navigate = useNavigate();
  const start = formatDate(trip.startDate);
  const end = formatDate(trip.endDate);

  return (
    <article className="gm-trip-popup">
      {trip.tripPhoto ? (
        <div className="gm-trip-popup__media">
          <img
            src={toFullMediaUrl(trip.tripPhoto)}
            alt={trip.title || `${trip.city}, ${trip.country}`}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div className="gm-trip-popup__media gm-trip-popup__media--placeholder">
          <MapPin size={28} strokeWidth={1.5} />
        </div>
      )}

      <div className="gm-trip-popup__body">
        <h3 className="gm-trip-popup__title">
          {trip.title || `${trip.city}, ${trip.country}`}
        </h3>

        {/* Round 73 — Multi-destination: when the trip has a
            `citiesVisited` array, show the full route joined with
            " → " (same as the trip detail page topbar) instead
            of just the first city. Single-destination trips
            still show the "City, Country" pair. */}
        {Array.isArray(trip.citiesVisited) && trip.citiesVisited.length > 1 ? (
          <p className="gm-trip-popup__location">
            {trip.citiesVisited.join(' → ')}
          </p>
        ) : (
          <p className="gm-trip-popup__location">
            {trip.city}, {trip.country}
          </p>
        )}

        {(trip.userUsername || trip.user) && (
          <p className="gm-trip-popup__author">
            <User size={12} strokeWidth={1.75} />
            <button
              type="button"
              className="gm-trip-popup__link"
              onClick={() => navigate(`/profile/${trip.userUsername || trip.user}`)}
            >
              @{trip.userUsername || trip.user}
            </button>
          </p>
        )}

        {(start || end) && (
          <p className="gm-trip-popup__dates">
            <Calendar size={12} strokeWidth={1.75} />
            {start}
            {end && end !== start ? ` – ${end}` : ""}
          </p>
        )}

        {trip.tripLink && (
          <button
            type="button"
            className="gm-trip-popup__cta"
            onClick={() => navigate(trip.tripLink)}
          >
            Ver viagem
          </button>
        )}
      </div>
    </article>
  );
};

export default TripPopup;
