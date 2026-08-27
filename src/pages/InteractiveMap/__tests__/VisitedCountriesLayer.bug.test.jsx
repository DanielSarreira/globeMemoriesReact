/**
 * Reproduces the reported bug: on first mount the Fog of War keeps
 * visited countries shaded, but switching tabs (unmount/remount)
 * fixes it.
 *
 * The suspect is the 4th effect (restyle-on-visited-change). This
 * test mounts the layer with an EMPTY visited list (as happens on
 * first load, before trips arrive), waits for the layer to be
 * created, then re-renders with a populated visited list and checks
 * whether the layer was actually restyled.
 */
import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import L from "leaflet";
import VisitedCountriesLayer from "../layers/VisitedCountriesLayer";

// Fake map returned by useMap. Leaflet's L.geoJSON can build the
// FeatureGroup (and its children) without a real map; addTo() is a
// no-op here, so the Path.setStyle() only mutates layer.options —
// which is exactly what we assert on.
// NOTE: created in beforeEach because CRA jest config sets
// resetMocks: true, which strips jest.fn implementations between
// tests.
const buildMockMap = () => ({
  _panes: {},
  options: {},
  createPane: jest.fn(() => ({ style: {} })),
  getPane: jest.fn(() => ({ style: {} })),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  setMinZoom: jest.fn(),
  setMaxZoom: jest.fn(),
});

jest.mock("react-leaflet", () => ({
  useMap: () => globalThis.__gmMockMap,
}));

// ── GeoJSON cache + fetch ──────────────────────────────────────
const FAKE_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Portugal", "ISO3166-1-Alpha-3": "PRT" },
      geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
    },
    {
      type: "Feature",
      properties: { name: "Spain", "ISO3166-1-Alpha-3": "ESP" },
      geometry: { type: "Polygon", coordinates: [[[2, 0], [3, 0], [3, 1], [2, 0]]] },
    },
  ],
};

const CACHE_KEY = "gm-fog-of-war-geojson-v3";
const putCache = () =>
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: FAKE_GEOJSON }));

/** Read the fillOpacity that each polygon ended up with. */
const readFillOpacities = () => {
  const layer = globalThis.__gmLastLayer;
  if (!layer) return [];
  const out = [];
  layer.eachLayer((lyr) => out.push({ name: lyr.feature?.properties?.name, fillOpacity: lyr.options.fillOpacity }));
  return out;
};

beforeEach(() => {
  sessionStorage.clear();
  delete globalThis.__gmLastLayer;
  globalThis.__gmMockMap = buildMockMap();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => FAKE_GEOJSON,
  });
});

// Spy on L.geoJSON so we can grab the created layer group.
const originalGeoJson = L.geoJSON;
beforeAll(() => {
  L.geoJSON = function (data, options) {
    const layer = originalGeoJson(data, options);
    globalThis.__gmLastLayer = layer;
    return layer;
  };
});
afterAll(() => {
  L.geoJSON = originalGeoJson;
});

describe("VisitedCountriesLayer first-mount race", () => {
  it("restyles visited countries when visitedCountries arrives after the layer is created", async () => {
    putCache(); // second visit: GeoJSON is served synchronously from sessionStorage

    const { rerender } = render(
      <VisitedCountriesLayer visitedCountries={[]} mode="mine" />,
    );

    // Wait until the layer is created (the effect that builds L.geoJSON ran).
    await waitFor(() => {
      expect(globalThis.__gmLastLayer).toBeTruthy();
    });

    // Layer was created while visitedCountries was empty → all unvisited.
    let fills = readFillOpacities();
    expect(fills.every((f) => f.fillOpacity !== 0)).toBe(true);

    // Now the trips arrive and visitedCountries becomes ["Portugal"].
    await act(async () => {
      rerender(<VisitedCountriesLayer visitedCountries={["Portugal"]} mode="mine" />);
    });

    // Portugal (PRT) must have been restyled to "visited/cleared" (fillOpacity 0).
    fills = readFillOpacities();
    const byName = Object.fromEntries(fills.map((f) => [f.name, f.fillOpacity]));
    expect(byName.Portugal).toBe(0);
    expect(byName.Spain).not.toBe(0);
  });
});
