/**
 * useGeocoding.js — resolves coordinates for a list of normalised
 * trips. Handles the async batching and the "all done?" signal.
 *
 * The hook:
 *   • Receives a list of normalised trips (with no coordinates).
 *   • Resolves (country, city) pairs in parallel batches.
 *   • Calls `onUpdate` whenever a new batch is resolved, so the
 *     caller can update its state incrementally (markers appear
 *     as coords resolve, no "all at once" flash).
 *   • Returns `{ progress, done }` for loading UI.
 */
import { useEffect, useRef, useState } from "react";
import { resolveCoordinates } from "../utils/geocoding";
import { GEOCODING_BATCH_SIZE } from "../utils/constants";

export function useGeocoding(trips, onUpdate) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const cancelledRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);

  // Keep the latest onUpdate without retriggering the effect.
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!Array.isArray(trips) || trips.length === 0) {
      setProgress(0);
      setDone(true);
      return undefined;
    }

    cancelledRef.current = false;
    setProgress(0);
    setDone(false);

    const queue = trips
      .map((t, idx) => ({ trip: t, idx }))
      .filter(({ trip }) => trip && trip.country && !trip.coordinates);

    if (queue.length === 0) {
      setProgress(trips.length);
      setDone(true);
      return undefined;
    }

    let resolved = 0;

    const processBatch = async () => {
      const batch = queue.splice(0, GEOCODING_BATCH_SIZE);
      await Promise.all(
        batch.map(async ({ trip, idx }) => {
          if (cancelledRef.current) return;
          const result = await resolveCoordinates(trip.country, trip.city);
          if (cancelledRef.current) return;
          resolved += 1;
          setProgress((p) => p + 1);
          if (result && Array.isArray(result.coordinates)) {
            onUpdateRef.current?.(idx, result.coordinates);
          }
        }),
      );
      if (cancelledRef.current) return;
      if (queue.length > 0) {
        processBatch();
      } else {
        setDone(true);
      }
    };

    processBatch();

    return () => {
      cancelledRef.current = true;
    };
  }, [trips]);

  return { progress, done, total: trips?.length || 0 };
}
