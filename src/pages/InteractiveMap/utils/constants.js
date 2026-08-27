/**
 * constants.js — magic strings and lookup tables used throughout
 * the Interactive Map page. Keep this list short; it should only
 * contain values that are:
 *   1. Truly constant (don't change at runtime), AND
 *   2. Shared across multiple components.
 */

import { Layers, Map as MapIcon, Mountain, Compass } from "lucide-react";

/** Layer order matches the LAYER_CONFIG from the legacy page and
 *  the order shown in the layer switch UI. */
export const LAYERS = Object.freeze([
  { id: "basic", label: "Básico", icon: Layers },
  { id: "streets", label: "Ruas", icon: MapIcon },
  { id: "terrain", label: "Terreno", icon: Mountain },
  { id: "satellite", label: "Satélite", icon: Compass },
]);

/** Default map mode on first visit. "mine" loads the user's own
 *  trips; "community" loads the following + public feed. */
export const DEFAULT_MODE = "mine";

/** Geocoding batch size. We resolve N trip coordinates in parallel
 *  to avoid hammering Nominatim. */
export const GEOCODING_BATCH_SIZE = 6;

/** Max public trips to fetch (the page is a map, not a feed — we
 *  cap the catalogue to keep the marker layer responsive). */
export const PUBLIC_TRIPS_PAGE_SIZE = 200;
export const FOLLOWING_TRIPS_PAGE_SIZE = 50;
export const MY_TRIPS_PAGE_SIZE = 50;

/** Welcome modal version. Bump this when the welcome copy changes
 *  significantly so users see the new version even if they had
 *  dismissed an earlier one. */
export const WELCOME_VERSION = 2;
export const WELCOME_DISMISS_KEY = "gm-map-welcome-dismissed-v2";

/** Privacy values accepted as "public" (a permissive filter — the
 *  backend is inconsistent about whether the field is `''`, `public`
 *  or `publica`). */
export const PUBLIC_PRIVACY_VALUES = Object.freeze([
  "",
  "public",
  "publica",
]);

/** Discovery progress: 195 widely-recognised sovereign states. */
export const TOTAL_COUNTRIES = 195;

/** Available filters in "Comunidade" mode. The shape is stable so
 *  we can render the filter chips without conditional logic. */
export const COMMUNITY_FILTERS = Object.freeze([
  { id: "following", label: "A seguir", color: "#5BA8FF" },
  { id: "public", label: "Públicas", color: "#FF9900" },
]);
