/**
 * MyTripsLayer.jsx — renders the user's own trip markers. Pure
 * presentational: receives a trips list, renders one <TripMarker />
 * per entry that has coordinates.
 *
 * The "Minhas" tab is the focal point of the page; the markers
 * use the brand-blue "visited" icon.
 *
 * Round 73 — Multi-destination support:
 *   1. One <TripMarker /> per row. A multi-destination trip
 *      arrives here as N rows (one per (city, country) pair,
 *      produced by `normaliseTrip`), so we get N pins.
 *   2. A dashed <Polyline /> connecting the pins in display
 *      order. We group the rows by `id` and draw one polyline
 *      per trip so a multi-stop trip shows up as a single
 *      route. Single-stop trips don't draw any line.
 */
import React, { useMemo } from "react";
import { Polyline } from "react-leaflet";
import TripMarker from "../markers/TripMarker";
import { useTripIcon } from "../markers/useTripIcon";

const VISITED_COLOR = "#007BFF";
const VISITED_TYPE = "visited";

const MyTripsLayer = ({ trips }) => {
  const icon = useTripIcon(VISITED_COLOR, VISITED_TYPE);

  // Round 73 — Group the flat trip list by `id` and build a
  // polyline for each multi-stop trip. Each row carries its
  // own `coordinates`; we concatenate them in `stopIndex`
  // order so the line follows the route as the user defined
  // it.
  const routeLines = useMemo(() => {
    const byId = new Map();
    (trips || []).forEach((t) => {
      if (!t || !Array.isArray(t.coordinates)) return;
      if (!t.id) return;
      if (!byId.has(t.id)) byId.set(t.id, []);
      byId.get(t.id).push(t);
    });
    const lines = [];
    byId.forEach((rows, id) => {
      if (rows.length < 2) return; // single-stop — no line
      const ordered = rows
        .slice()
        .sort((a, b) => (a.stopIndex ?? 0) - (b.stopIndex ?? 0))
        .map((r) => r.coordinates)
        .filter((c) => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]));
      if (ordered.length >= 2) {
        lines.push({ id, positions: ordered });
      }
    });
    return lines;
  }, [trips]);

  return (
    <>
      {routeLines.map(({ id, positions }) => (
        <Polyline
          key={`route-${id}`}
          positions={positions}
          pathOptions={{
            color: VISITED_COLOR,
            weight: 2.5,
            opacity: 0.85,
            dashArray: "6 8",
          }}
        />
      ))}
      {trips.map((trip, i) => (
        <TripMarker key={`mine-${trip.id}-${i}`} trip={trip} icon={icon} />
      ))}
    </>
  );
};

export default React.memo(MyTripsLayer);
