/**
 * useDiscovery.js — computes the "Mundo explorado X / N" widget
 * data from the user's visited countries. The numbers feed both
 * the discovery progress bar and the Fog of War overlay.
 *
 * The country→ISO3 conversion lives in /utils/countryIso.js so
 * matching is language-agnostic (works for "Portugal", "Brasil",
 * "Marrocos", "E.U.A.", etc.).
 */
import { useMemo } from "react";
import { countriesToIso3Set, TOTAL_COUNTRIES } from "../../../utils/countryIso";

export function useDiscovery(visitedCountries) {
  return useMemo(() => {
    const iso3 = countriesToIso3Set(visitedCountries);
    const visited = iso3.size;
    const total = TOTAL_COUNTRIES;
    const percent = total > 0 ? Math.round((visited / total) * 1000) / 10 : 0;
    return { visited, total, percent, iso3 };
  }, [visitedCountries]);
}
