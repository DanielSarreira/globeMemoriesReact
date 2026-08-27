/**
 * MapCanvas.jsx — the <MapContainer /> host. Single source of
 * truth for Leaflet config (consumed from utils/leafletConfig.js).
 *
 * This component is dumb on purpose: it just wires the map
 * container + tile layer + the layers passed in. State, data and
 * UI live elsewhere.
 *
 * It also renders a defensive <MapConfigGuard /> that re-asserts
 * the single-world and animation-off flags on the live map
 * instance — a safety net for any future refactor that might
 * toggle the wrong option at the wrong layer.
 */
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  mapContainerOptions,
  tileLayerBaseOptions,
  MAP_LAYERS,
  MAP_BACKGROUND,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
} from "../../utils/leafletConfig";
import { MapInstanceBridge } from "../../hooks/useMapInstance";
import MyTripsLayer from "../../layers/MyTripsLayer";
import CommunityLayer from "../../layers/CommunityLayer";
import SearchMarkerLayer from "../../layers/SearchMarkerLayer";
import VisitedCountriesLayer from "../../layers/VisitedCountriesLayer";
import MapControls from "./MapControls";

/** Defensive guard. Re-asserts the critical Leaflet flags on the
 *  live map instance after mount. Single source of truth is still
 *  the props passed to <MapContainer /> — this is the safety net. */
const MapConfigGuard = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;
    if ("worldCopyJump" in map.options) map.options.worldCopyJump = false;
    if ("continuousWorld" in map.options) map.options.continuousWorld = false;
    if ("fadeAnimation" in map.options) map.options.fadeAnimation = false;
    if ("zoomAnimation" in map.options) map.options.zoomAnimation = false;
    if ("markerZoomAnimation" in map.options) {
      map.options.markerZoomAnimation = false;
    }
    try { map.setMinZoom(MAP_MIN_ZOOM); } catch (_) { /* noop */ }
    try { map.setMaxZoom(MAP_MAX_ZOOM); } catch (_) { /* noop */ }

    // Force an invalidateSize once the first paint settles.
    requestAnimationFrame(() => {
      try { map.invalidateSize({ animate: false, pan: false }); } catch (_) { /* noop */ }
    });
    return undefined;
  }, [map]);

  return null;
};

/** Handles fly-to when the user picks a search result or magic
 *  destination. Re-runs on (selectedLocation) change. */
const MapFlyToController = ({ selectedLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedLocation || !Array.isArray(selectedLocation.coordinates)) return;
    const { coordinates, zoom } = selectedLocation;
    try {
      map.flyTo(coordinates, zoom ?? map.getZoom(), { duration: 1 });
    } catch (_) {
      /* noop */
    }
  }, [selectedLocation, map]);

  return null;
};

const MapCanvas = ({
  mapRef,
  activeLayer,
  mode,
  visitedCountries,
  myTrips,
  followingTrips,
  publicTrips,
  searchMarker,
  selectedLocation,
}) => {
  const layer = MAP_LAYERS[activeLayer] || MAP_LAYERS.basic;

  return (
    <MapContainer
      {...mapContainerOptions}
      style={{ height: "100%", width: "100%", background: MAP_BACKGROUND }}
      ref={mapRef}
    >
      <MapInstanceBridge mapRef={mapRef} />
      <MapConfigGuard />
      <MapFlyToController selectedLocation={selectedLocation} />

      {mode === "mine" && (
        <VisitedCountriesLayer
          visitedCountries={visitedCountries}
          mode={mode}
        />
      )}

      <TileLayer
        key={activeLayer}
        url={layer.url}
        attribution={layer.attribution}
        {...tileLayerBaseOptions}
      />

      {mode === "mine" && <MyTripsLayer trips={myTrips} />}
      {mode === "community" && (
        <CommunityLayer
          following={followingTrips}
          publicTrips={publicTrips}
        />
      )}

      <SearchMarkerLayer searchMarker={searchMarker} />

      {selectedLocation?.radius && (
        <Circle
          center={selectedLocation.coordinates}
          radius={selectedLocation.radius}
          pathOptions={{
            color: "#007BFF",
            fillColor: "#007BFF",
            fillOpacity: 0.1,
            weight: 2,
          }}
        />
      )}

      <MapControls />
    </MapContainer>
  );
};

export default MapCanvas;
