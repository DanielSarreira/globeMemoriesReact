/**
 * useTripsData.js — fetches trips from the three backend endpoints
 * the page consumes and returns a flat, normalised list for each.
 *
 * Endpoints:
 *   • /trips/following-feed   → following trips (auth-required)
 *   • /trips/public-feed      → public trips (permitAll)
 *   • /trips/my-trips         → user's own trips (auth-required)
 *
 * Each fetch runs on mount and on demand. We DO NOT retry on
 * auth-failure (just degrade silently to an empty list) — this
 * page should work for unauthenticated users browsing the
 * public feed.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../axios_helper";
import { normaliseTripList, dedupeById } from "../utils/tripNormalizer";
import {
  PUBLIC_TRIPS_PAGE_SIZE,
  FOLLOWING_TRIPS_PAGE_SIZE,
  MY_TRIPS_PAGE_SIZE,
  PUBLIC_PRIVACY_VALUES,
} from "../utils/constants";

const isPublic = (trip) => {
  const p = (trip?.privacy || trip?.tripPrivacy || "")
    .toString()
    .toLowerCase();
  return PUBLIC_PRIVACY_VALUES.includes(p);
};

const fetchPage = async (path, page, size) => {
  try {
    const res = await api.get(path, { params: { page, size } });
    const content = res?.data?.content;
    return Array.isArray(content) ? content : [];
  } catch (_) {
    return [];
  }
};

export function useTripsData() {
  const [following, setFollowing] = useState([]);
  const [publicTrips, setPublicTrips] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFollowing = useCallback(async () => {
    const list = await fetchPage(
      "/trips/following-feed",
      0,
      FOLLOWING_TRIPS_PAGE_SIZE,
    );
    setFollowing(normaliseTripList(list));
  }, []);

  const loadPublic = useCallback(async () => {
    const list = await fetchPage(
      "/trips/public-feed",
      0,
      PUBLIC_TRIPS_PAGE_SIZE,
    );
    setPublicTrips(normaliseTripList(list));
  }, []);

  const loadMyTrips = useCallback(async () => {
    const list = await fetchPage("/trips/my-trips", 0, MY_TRIPS_PAGE_SIZE);
    // "Minhas" only shows PUBLIC trips on the map — private trips
    // never appear, even to the owner.
    const publicOnly = (list || []).filter(isPublic);
    setMyTrips(normaliseTripList(publicOnly));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadFollowing(), loadPublic(), loadMyTrips()]);
    } finally {
      setLoading(false);
    }
  }, [loadFollowing, loadPublic, loadMyTrips]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Deduplicated public layer — a trip followed AND public should
  // only show up once in the community layer (we keep the entry
  // from `following` because that's the closer relationship).
  // MUST be memoised: this is the dep of the geocoding effect in
  // the page; without memo it would be a new reference every
  // render and the effect would re-run forever.
  const communityTrips = useMemo(
    () => dedupeById([...following, ...publicTrips]),
    [following, publicTrips],
  );

  return {
    following,
    publicTrips,
    myTrips,
    communityTrips,
    loading,
    refresh,
  };
}
