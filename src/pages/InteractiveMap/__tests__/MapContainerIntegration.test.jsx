/**
 * Integration-ish check: does the restyle-on-visited-change still
 * work when the layer lives inside a REAL react-leaflet MapContainer
 * (real Leaflet map, real SVG renderer)? If the jsdom map can create
 * SVG paths, this exercises Path.setStyle against real DOM.
 */
import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { MapContainer, useMap } from "react-leaflet";
import VisitedCountriesLayer from "../layers/VisitedCountriesLayer";

const FAKE_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Portugal", "ISO3166-1-Alpha-3": "PRT" },
      geometry: { type: "Polygon", coordinates: [[[-9, 36], [-6, 36], [-6, 42], [-9, 42], [-9, 36]]] },
    },
  ],
};

const CACHE_KEY = "gm-fog-of-war-geojson-v3";

/** A component inside the map that reads the fog paths' fills. */
const FogInspector = () => {
  const map = useMap();
  const getState = () => {
    const svg = map.getPane && map.getPane("gm-fog-pane");
    if (!svg) return null;
    const path = svg.querySelector && svg.querySelector("path");
    return path
      ? { fill: path.getAttribute("fill"), fillOpacity: path.getAttribute("fill-opacity") }
      : null;
  };
  return null;
};

let inspector = null;

const Harness = ({ visitedCountries }) => {
  const ref = React.useRef();
  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      style={{ height: "400px", width: "600px" }}
      ref={ref}
    >
      <FogInspector ref={(i) => { inspector = i; }} />
      <VisitedCountriesLayer visitedCountries={visitedCountries} mode="mine" />
    </MapContainer>
  );
};

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => FAKE_GEOJSON,
  });
});

describe("VisitedCountriesLayer inside a real MapContainer", () => {
  it("clears the fog when visitedCountries arrives after the layer is built", async () => {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data: FAKE_GEOJSON }),
    );

    const { rerender } = render(<Harness visitedCountries={[]} />);

    // Wait for the layer to be created (a path exists in the fog pane).
    await waitFor(() => {
      expect(inspector).toBeTruthy();
    });

    // Now trips arrive → visitedCountries becomes ["Portugal"].
    await act(async () => {
      rerender(<Harness visitedCountries={["Portugal"]} />);
    });

    // Portugal path should now be "cleared" (transparent).
    expect(inspector.getState()).toEqual({ fill: "#000000", fillOpacity: "0" });
  });
});
