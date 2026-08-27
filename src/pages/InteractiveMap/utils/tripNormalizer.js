/**
 * tripNormalizer.js — converts the two backend shapes the page
 * consumes (TripFeedDto and TripDto) into a single, stable shape
 * the rest of the page can rely on.
 */
import { getDisplayName } from '../../../utils/userDisplay';

/**
 * Backend shapes:
 *   • TripFeedDto (from /trips/public-feed, /trips/following-feed):
 *       { tripId, tripTitle, tripPhoto, countriesVisited[],
 *         citiesVisited[], username, userFirstName, userLastName, ... }
 *   • TripDto (from /trips/my-trips, the "Minhas" tab):
 *       { id, title, country, cityName, photos[], username, ...,
 *         privacy }
 *
 * Output shape (one entry per (city, country) pair — a multi-city
 * trip becomes multiple pins):
 *   {
 *     id, title, city, country, coordinates, startDate, endDate,
 *     tripPhoto, user, userUsername, tripLink, label, privacy
 *   }
 */

/** @typedef {Object} NormalizedTrip
 *  @property {number|string} id
 *  @property {string} title
 *  @property {string} city
 *  @property {string} country
 *  @property {[number, number] | null} coordinates
 *  @property {string|undefined} startDate
 *  @property {string|undefined} endDate
 *  @property {string|null} tripPhoto
 *  @property {string} user
 *  @property {string} userUsername
 *  @property {string} tripLink
 *  @property {string} label
 *  @property {string|undefined} privacy
 */

/** Normalize a single raw trip. Returns `null` if the trip has no
 *  resolvable country/city pair (i.e. we cannot place a pin for it
 *  at all — the page will silently drop these). */
export function normaliseTrip(raw) {
  if (!raw) return null;
  const id = raw.id ?? raw.tripId;
  const title = raw.title ?? raw.tripTitle ?? "Viagem";
  // Round 47 — Prefer the live "First Last" name from the backend
  // (so a profile rename reflects immediately) over the cached
  // `user` / `username` fields. `userUsername` is the raw
  // @username used for /profile links (kept separate from
  // `user` because firstName + lastName can contain spaces).
  const userUsername = raw.user ?? raw.username ?? "";
  const user = getDisplayName({
    userFirstName: raw.userFirstName,
    userLastName: raw.userLastName,
    username: userUsername,
  }, userUsername);
  const privacy = raw.privacy ?? raw.tripPrivacy;

  const tripPhoto =
    raw.tripPhoto ??
    raw.photo ??
    (Array.isArray(raw.photos) && raw.photos.length > 0
      ? raw.photos[0]
      : null);

  // Countries / cities: TripFeedDto uses arrays, TripDto uses single
  // strings. Normalise to arrays.
  //   • TripFeedDto (from /trips/public-feed, /trips/following-feed):
  //       raw.citiesVisited[] / raw.countriesVisited[]
  //   • TripDto (from /trips/my-trips):
  //       raw.citiesDetail[] (List<TripCityDto> with cityName + countryname)
  //       raw.cityName (first city) / raw.country (first country)
  //       raw.cities[] (list of city IDs — NOT useful here)
  const countries =
    Array.isArray(raw.countriesVisited) && raw.countriesVisited.length > 0
      ? raw.countriesVisited
      : Array.isArray(raw.citiesDetail) && raw.citiesDetail.length > 0
        ? raw.citiesDetail.map((c) => c.countryname).filter(Boolean)
        : raw.country
          ? [raw.country]
          : [];
  const cities =
    Array.isArray(raw.citiesVisited) && raw.citiesVisited.length > 0
      ? raw.citiesVisited
      : Array.isArray(raw.citiesDetail) && raw.citiesDetail.length > 0
        ? raw.citiesDetail.map((c) => c.cityName).filter(Boolean)
        : raw.cityName
          ? [raw.cityName]
          : raw.city
            ? [raw.city]
            : [];

  // Flatten to one entry per (country, city) pair.
  const pairs = [];
  if (cities.length > 0) {
    cities.forEach((city, idx) => {
      const country = countries[idx] || countries[0] || "";
      if (city && country) pairs.push({ city, country });
    });
  }
  if (pairs.length === 0 && countries.length > 0) {
    countries.forEach((country) => pairs.push({ city: country, country }));
  }
  if (pairs.length === 0) return null;

  return pairs.map((p) => ({
    id,
    title,
    city: p.city,
    country: p.country,
    // Round 73 — Multi-destination: pass the full city/country
    // list down to every row so the TripPopup can render the
    // complete route ("Bridgetown → Abrantes") no popup of EACH
    // pin, not just the first one. Without this the popup
    // collapses to "City, Country" of the current pin and
    // gives no hint that the trip visits more places.
    citiesVisited: cities,
    countriesVisited: countries,
    // Total number of stops (used by the popup / route polylines
    // to know this is a multi-destination trip).
    stopsCount: pairs.length,
    // Index of THIS pin in the route (0-based, used to highlight
    // the active stop in the popup).
    stopIndex: pairs.findIndex((pp) => pp.city === p.city && pp.country === p.country),
    coordinates: null, // populated later by useGeocoding
    startDate: raw.startDate,
    endDate: raw.endDate,
    tripPhoto,
    user,
    userUsername,
    tripLink: `/travel/${id}`,
    label: `${p.city}, ${p.country}`,
    privacy,
  }));
}

/** Normalize a list of raw trips. Returns a flat array of normalised
 *  rows (one per (city, country) pair). */
export function normaliseTripList(list) {
  const out = [];
  (list || []).forEach((raw) => {
    const norm = normaliseTrip(raw);
    if (Array.isArray(norm)) out.push(...norm);
  });
  return out;
}

/** Deduplicate a flat list of normalised trips by id. Two entries
 *  with the same id collapse to the first one — used by the
 *  Community layer to avoid showing the same trip twice when it
 *  appears in both /following-feed and /public-feed. */
export function dedupeById(list) {
  const seen = new Set();
  const out = [];
  (list || []).forEach((t) => {
    if (!t || seen.has(t.id)) return;
    seen.add(t.id);
    out.push(t);
  });
  return out;
}
