/**
 * InteractiveMapPage.jsx — the page shell. Wires every hook and
 * every UI component together. Everything that's not Leaflet,
 * not a hook, and not a sub-component lives here.
 *
 * Responsibilities (and only these):
 *   1. Compose the page layout (Map on the left, panel on the
 *      right on desktop; full-screen map + bottom sheet + FAB on
 *      mobile).
 *   2. Subscribe to the data and state hooks.
 *   3. Plumb callbacks between UI components and state actions.
 *   4. Trigger the geocoding pipeline after trips are loaded.
 *   5. Trigger the magic arrow sequence.
 *   6. Show / hide the welcome and destination modals.
 *
 * NO Leaflet imports, NO coordinates hard-coded, NO business
 * logic — those all live in their dedicated modules.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./InteractiveMap.css";

import { useMapState } from "./hooks/useMapState";
import { useTripsData } from "./hooks/useTripsData";
import { useDiscovery } from "./hooks/useDiscovery";
import { useMapInstance } from "./hooks/useMapInstance";
import { useNominatimSearch, extractLocationInfo } from "./hooks/useNominatimSearch";

import { pickRandomDestination } from "./utils/magicDestinations";
import { resolveCoordinates } from "./utils/geocoding";

import MapCanvas from "./components/map/MapCanvas";
import MapPanel from "./components/panels/MapPanel";
import MapBottomSheet from "./components/panels/MapBottomSheet";
import MapFAB from "./components/map/MapFAB";
import DestinationModal from "./components/modals/DestinationModal";

const useIsMobile = () => {
  const [m, setM] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 720 : false,
  );
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < 720);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return m;
};

const InteractiveMapPage = () => {
  const { state, actions } = useMapState();
  const { mapRef } = useMapInstance();
  const isMobile = useIsMobile();

  // Destructure early so the useMemos below can read individual
  // state slices without hitting a TDZ ReferenceError.
  const {
    mode, panelCollapsed, mobileSheetOpen, activeLayer,
    filters, searchMarker, selectedLocation,
    magicDestination, showDestinationModal, isArrowFlying,
  } = state;

  // Data
  const { myTrips, following, publicTrips, communityTrips, loading } =
    useTripsData();

  // Enrich trips with coordinates (parallel, async). Resolved once
  // per (myTrips | communityTrips) reference change. The local maps
  // already cover most cities so this resolves in <50ms in practice.
  // We do NOT mutate inputs and we only create new objects for the
  // rows whose coordinates actually changed — so the result is
  // referentially stable when nothing changed, and React can bail
  // out of re-renders.
  const enrichWithCoords = useCallback(async (list) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    const next = await Promise.all(
      list.map(async (t) => {
        if (!t) return t;
        if (t.coordinates) return t;
        const r = await resolveCoordinates(t.country, t.city);
        return r && Array.isArray(r.coordinates)
          ? { ...t, coordinates: r.coordinates }
          : t;
      }),
    );
    return next;
  }, []);

  // Reference-comparison: skip setState when nothing changed. This
  // is what stops the geocoding pipeline from re-running every time
  // the page re-renders for an unrelated reason.
  const sameShape = useCallback((a, b) => {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        // If the only difference is a stable coordinates addition,
        // we still want to treat the list as new (the markers will
        // re-render with the new coords). But for the geocoding
        // pipeline, two arrays with the same shape and identical
        // item references ARE the same.
        return false;
      }
    }
    return true;
  }, []);

  const [myTripsWithCoords, setMyTripsWithCoords] = useState([]);
  useEffect(() => {
    let cancelled = false;
    if (myTrips.length === 0) {
      setMyTripsWithCoords((prev) => (prev.length === 0 ? prev : []));
      return undefined;
    }
    enrichWithCoords(myTrips).then((res) => {
      if (cancelled) return;
      setMyTripsWithCoords((prev) => (sameShape(prev, res) ? prev : res));
    });
    return () => { cancelled = true; };
  }, [myTrips, enrichWithCoords, sameShape]);

  const [communityWithCoords, setCommunityWithCoords] = useState([]);
  useEffect(() => {
    let cancelled = false;
    if (communityTrips.length === 0) {
      setCommunityWithCoords((prev) => (prev.length === 0 ? prev : []));
      return undefined;
    }
    enrichWithCoords(communityTrips).then((res) => {
      if (cancelled) return;
      setCommunityWithCoords((prev) => (sameShape(prev, res) ? prev : res));
    });
    return () => { cancelled = true; };
  }, [communityTrips, enrichWithCoords, sameShape]);

  // Visited countries (unique strings) — derived for the Fog of
  // War and the discovery widget.
  const visitedCountries = useMemo(() => {
    const set = new Set();
    myTripsWithCoords.forEach((t) => {
      if (t && t.country) {
        const c = t.country.toString().trim();
        if (c) set.add(c);
      }
    });
    return Array.from(set);
  }, [myTripsWithCoords]);

  const discovery = useDiscovery(visitedCountries);

  // Counts for the tab badges.
  const counts = useMemo(
    () => ({
      visited: myTripsWithCoords.length,
      community: communityTrips.length,
    }),
    [myTripsWithCoords, communityTrips],
  );

  // Split community trips into "following" and "public-only" lists.
  // The "following" check here just means "this trip is from a user
  // you follow" — it's independent of the "A seguir" filter chip;
  // the chip's `filters.following` flag below decides whether to
  // show that list on the map.
  const followingWithCoords = useMemo(
    () => communityWithCoords.filter((t) => following.some((f) => f.id === t.id)),
    [communityWithCoords, following],
  );
  const publicOnlyWithCoords = useMemo(
    () => communityWithCoords.filter((t) => !following.some((f) => f.id === t.id)),
    [communityWithCoords, following],
  );

  // Apply the user-visible filter chips. Each can be toggled
  // independently; if both are off, no community pins render.
  const visibleFollowing = useMemo(
    () => (filters.following ? followingWithCoords : []),
    [filters.following, followingWithCoords],
  );
  const visiblePublic = useMemo(
    () => (filters.public ? publicOnlyWithCoords : []),
    [filters.public, publicOnlyWithCoords],
  );

  // Search
  const search = useNominatimSearch();

  // Magic arrow sequence.
  const handleMagicClick = useCallback(() => {
    const dest = pickRandomDestination();
    actions.startMagic(dest);
    // 1) Show "looking..." marker
    actions.setSelectedLocation({
      coordinates: [20, 0],
      name: "Procurando destino...",
      zoom: 2,
      radius: 0,
    });
    setTimeout(() => {
      actions.setSelectedLocation({
        coordinates: dest.coordinates,
        name: `A voar para ${dest.city}, ${dest.country}...`,
        zoom: 6,
        radius: 50000,
      });
    }, 1000);
    setTimeout(() => {
      actions.endMagic(dest);
      actions.setSelectedLocation({
        coordinates: dest.coordinates,
        name: `${dest.city}, ${dest.country}`,
        zoom: 8,
        radius: 30000,
      });
    }, 3000);
  }, [actions]);

  // Search selection → fly to + place a marker.
  const handleSearchSelect = useCallback(
    (result) => {
      const { country, city } = extractLocationInfo(result);
      const coordinates = [parseFloat(result.lat), parseFloat(result.lon)];
      actions.setSearchMarker({ coordinates, name: result.display_name, country, city });
      actions.setSelectedLocation({
        coordinates,
        name: result.display_name,
        zoom: result.zoom || 10,
        radius: result.type === "País" ? 50000 : result.type === "Cidade" ? 10000 : 5000,
      });
      actions.setSearchQuery("");
      actions.setSearchResults([]);
      if (isMobile) actions.closeMobileSheet();
    },
    [actions, isMobile],
  );

  return (
    <div className="gm-map-page">
      <div className="gm-map__viewport">
        <MapCanvas
          mapRef={mapRef}
          activeLayer={activeLayer}
          mode={mode}
          visitedCountries={visitedCountries}
          myTrips={myTripsWithCoords}
          followingTrips={visibleFollowing}
          publicTrips={visiblePublic}
          searchMarker={searchMarker}
          selectedLocation={selectedLocation}
        />
      </div>

      {isMobile ? (
        <>
          <MapFAB onClick={actions.openMobileSheet} />
          <MapBottomSheet
            open={mobileSheetOpen}
            onClose={actions.closeMobileSheet}
            mode={mode}
            counts={counts}
            discovery={discovery}
            filters={filters}
            onModeChange={actions.setMode}
            onFilterToggle={actions.toggleFilter}
            activeLayer={activeLayer}
            onLayerChange={actions.setActiveLayer}
            onMagicClick={handleMagicClick}
            isArrowFlying={isArrowFlying}
          />
        </>
      ) : (
        <MapPanel
          collapsed={panelCollapsed}
          onToggleCollapse={actions.togglePanel}
          mode={mode}
          counts={counts}
          discovery={discovery}
          search={{
            query: search.query,
            results: search.results,
            loading: search.loading,
          }}
          filters={filters}
          onModeChange={actions.setMode}
          onFilterToggle={actions.toggleFilter}
          onSearchQuery={search.setQuery}
          onSearchSelect={handleSearchSelect}
          onSearchClear={search.clear}
          activeLayer={activeLayer}
          onLayerChange={actions.setActiveLayer}
          onMagicClick={handleMagicClick}
          isArrowFlying={isArrowFlying}
        />
      )}

      <DestinationModal
        open={showDestinationModal}
        destination={magicDestination}
        onClose={actions.closeDestinationModal}
      />

      {loading && (
        <div className="gm-map__loading-pill" aria-live="polite">
          A carregar viagens…
        </div>
      )}
    </div>
  );
};

export default InteractiveMapPage;
