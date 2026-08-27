/**
 * countryCentroids.js — country-level centroid fallback. Used when
 * we don't have the city in the local map and Nominatim also failed.
 *
 * Covers the ~60 most-visited countries on the platform. A country
 * centroid is far better than dropping the pin entirely — the user
 * still sees the trip on the map, just at the capital.
 */
const norm = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const COUNTRY_CENTROIDS = Object.freeze({
  // ── Europe ───────────────────────────────────────────────
  portugal: [39.3999, -8.2245],
  espanha: [40.4637, -3.7492],
  spain: [40.4637, -3.7492],
  franca: [46.6034, 1.8883],
  france: [46.6034, 1.8883],
  italia: [41.8719, 12.5674],
  italy: [41.8719, 12.5674],
  "reino unido": [55.3781, -3.436],
  "united kingdom": [55.3781, -3.436],
  uk: [55.3781, -3.436],
  alemanha: [51.1657, 10.4515],
  germany: [51.1657, 10.4515],
  holanda: [52.1326, 5.2913],
  netherlands: [52.1326, 5.2913],
  belgica: [50.5039, 4.4699],
  belgium: [50.5039, 4.4699],
  suica: [46.8182, 8.2275],
  switzerland: [46.8182, 8.2275],
  austria: [47.5162, 14.5501],
  tchequia: [49.8175, 15.473],
  czechia: [49.8175, 15.473],
  hungria: [47.1625, 19.5033],
  hungary: [47.1625, 19.5033],
  grecia: [39.0742, 21.8243],
  greece: [39.0742, 21.8243],
  turquia: [38.9637, 35.2433],
  turkey: [38.9637, 35.2433],
  irlanda: [53.4129, -8.2439],
  ireland: [53.4129, -8.2439],
  polonia: [51.9194, 19.1451],
  poland: [51.9194, 19.1451],
  ucrania: [48.3794, 31.1656],
  ukraine: [48.3794, 31.1656],
  russia: [61.524, 105.3188],

  // ── Americas ─────────────────────────────────────────────
  eua: [39.8283, -98.5795],
  "estados unidos": [39.8283, -98.5795],
  "united states": [39.8283, -98.5795],
  usa: [39.8283, -98.5795],
  canada: [56.1304, -106.3468],
  mexico: [23.6345, -102.5528],
  brasil: [-14.235, -51.9253],
  brazil: [-14.235, -51.9253],
  argentina: [-38.4161, -63.6167],
  chile: [-35.6751, -71.543],
  peru: [-9.19, -75.0152],
  colombia: [4.5709, -74.2973],
  venezuela: [6.4238, -66.5897],

  // ── Asia ─────────────────────────────────────────────────
  japao: [36.2048, 138.2529],
  japan: [36.2048, 138.2529],
  china: [35.8617, 104.1954],
  tailandia: [15.87, 100.9925],
  thailand: [15.87, 100.9925],
  indonesia: [-0.7893, 113.9213],
  malasia: [4.2105, 101.9758],
  malaysia: [4.2105, 101.9758],
  vietnam: [14.0583, 108.2772],
  filipinas: [12.8797, 121.774],
  india: [20.5937, 78.9629],
  "emirados": [23.4241, 53.8478],
  uae: [23.4241, 53.8478],
  marrocos: [31.7917, -7.0926],
  morocco: [31.7917, -7.0926],
  egipto: [26.8206, 30.8025],
  egypt: [26.8206, 30.8025],

  // ── Oceania ──────────────────────────────────────────────
  australia: [-25.2744, 133.7751],
  "nova zelandia": [-41.2865, 174.7762],
  "new zealand": [-41.2865, 174.7762],

  // ── Africa (lusophone) ───────────────────────────────────
  angola: [-11.2027, 17.8739],
  mocambique: [-18.6657, 35.5296],
  mozambique: [-18.6657, 35.5296],
  "cabo verde": [15.1201, -23.6052],
  "cape verde": [15.1201, -23.6052],
  "south africa": [-30.5595, 22.9375],
  "africa do sul": [-30.5595, 22.9375],

  // ── Northern Europe ──────────────────────────────────────
  islandia: [64.9631, -19.0208],
  iceland: [64.9631, -19.0208],
  noruega: [60.472, 8.4689],
  norway: [60.472, 8.4689],
  suecia: [60.1282, 18.6435],
  sweden: [60.1282, 18.6435],
  finlandia: [61.9241, 25.7482],
  finland: [61.9241, 25.7482],
  dinamarca: [56.2639, 9.5018],
  denmark: [56.2639, 9.5018],

  // ── Small European countries ─────────────────────────────
  albania: [41.1533, 20.1683],
  afghanistan: [33.9391, 67.71],
  andorra: [42.5063, 1.5218],
  malta: [35.9375, 14.3754],
  monaco: [43.7384, 7.4246],
  liechtenstein: [47.166, 9.5554],
  "san marino": [43.9424, 12.4578],
});

/** Look up a country centroid. Returns [lat, lng] or null. */
export function getCountryCentroid(country) {
  if (!country) return null;
  return COUNTRY_CENTROIDS[norm(country)] || null;
}
