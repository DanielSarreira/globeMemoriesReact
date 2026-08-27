/**
 * geocoding.js — single entry point for resolving a (country, city)
 * pair into [lat, lng] coordinates. Tries the local maps first
 * (fast, offline, no rate limit), then falls back to Nominatim
 * (network), then to a country centroid (last resort).
 *
 * Returns `{ coordinates: [lat, lng], source: 'local' | 'nominatim'
 * | 'country', name: string }` or `null` if all strategies failed.
 */
import { getCityCountryCoords } from "./cityCoordinates";
import { getCountryCentroid } from "./countryCentroids";

/** In-memory cache so we don't re-resolve the same city in the
 *  same session. Keyed by "city|country". */
const memCache = new Map();

/** Build a stable key for the cache. */
const cacheKey = (country, city) =>
  `${(country || "").toString().trim().toLowerCase()}|${(city || "").toString().trim().toLowerCase()}`;

/** Try Nominatim. Returns null on any failure — we never throw. */
async function tryNominatim(country, city) {
  try {
    const query = city
      ? `${encodeURIComponent(city)},${encodeURIComponent(country || "")}`
      : encodeURIComponent(country || "");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&accept-language=pt-PT`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const hit = data[0];
    return {
      coordinates: [parseFloat(hit.lat), parseFloat(hit.lon)],
      name: (hit.display_name || "").split(",")[0] || city || country,
      source: "nominatim",
    };
  } catch (_) {
    return null;
  }
}

/** Resolve coordinates for a (country, city) pair.
 *
 *  Order:
 *    1. In-memory cache (instant)
 *    2. Local city map (instant, offline)
 *    3. Local "city, country" combo map (instant, offline)
 *    4. Nominatim (network, slow, may fail) — preferred for accuracy
 *    5. Country centroid (instant, offline) — last resort fallback
 *
 *  Round 53 — Reordered to try Nominatim BEFORE the country centroid
 *  so a city we don't have locally (e.g. Torres Vedras) resolves to
 *  its actual position instead of the country centroid (which places
 *  the pin in the geographic middle of the country — hundreds of km
 *  away from the actual city). The centroid is still kept as a last
 *  resort so the pin never disappears if Nominatim times out.
 */
export async function resolveCoordinates(country, city) {
  const key = cacheKey(country, city);
  if (memCache.has(key)) return memCache.get(key);

  // 1. Local city map (exact match, instant)
  const local = getCityCountryCoords(city, country);
  if (local) {
    const result = { coordinates: local, name: city || country, source: "local" };
    memCache.set(key, result);
    return result;
  }

  // 2. Nominatim (network) — preferred for unknown cities so the pin
  //    lands on the actual city, not the country centroid.
  const nomi = await tryNominatim(country, city);
  if (nomi) {
    memCache.set(key, nomi);
    return nomi;
  }

  // 3. Country centroid (offline last resort) — at least the pin
  //    shows up on the country, not lost in the ocean.
  const centroid = getCountryCentroid(country);
  if (centroid) {
    const result = { coordinates: centroid, name: country, source: "country" };
    memCache.set(key, result);
    return result;
  }

  return null;
}

/** Clear the in-memory cache. Useful for tests or "refresh". */
export function clearGeocodingCache() {
  memCache.clear();
}

/** Sync check: does this (country, city) pair resolve locally?
 *  Used by the data layer to skip Nominatim calls entirely when
 *  the local map already has the answer. */
export function hasLocalCoords(country, city) {
  if (!country && !city) return false;
  if (city && getCityCountryCoords(city, country)) return true;
  if (country && getCountryCentroid(country)) return true;
  return false;
}
