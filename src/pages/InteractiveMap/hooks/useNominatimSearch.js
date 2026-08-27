/**
 * useNominatimSearch.js — debounced Nominatim search. Returns
 * { query, results, loading, search, clear, select }.
 *
 * The hook is the only place that talks to nominatim.openstreetmap.org.
 * The MapSearch component is just the input + results list.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";

const formatLocationType = (type) => {
  if (type === "country") return "País";
  if (["city", "town", "village"].includes(type)) return "Cidade";
  if (["state", "administrative"].includes(type)) return "Região";
  if (["suburb", "neighbourhood"].includes(type)) return "Bairro";
  if (["attraction", "landmark"].includes(type)) return "Ponto Turístico";
  return "Local";
};

const formatLocationName = (result) => {
  const parts = result.display_name.split(",");
  if (result.type === "country") return `${parts[0]} - País`;
  if (["city", "town"].includes(result.type)) {
    const city = parts[0];
    const region = parts[parts.length - 3]?.trim();
    const country = parts[parts.length - 1]?.trim();
    return `${city}${region ? `, ${region}` : ""}${country ? ` - ${country}` : ""}`;
  }
  return result.display_name.replace(/, Portugal$/, "").replace(/,.*$/, "");
};

export function useNominatimSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const search = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&accept-language=pt-PT&addressdetails=1`,
      );
      const data = await res.json();
      if (cancelledRef.current) return;
      const processed = data.map((r) => ({
        ...r,
        display_name: formatLocationName(r),
        type: formatLocationType(r.type),
        zoom: r.type === "country" ? 5
          : ["city", "town"].includes(r.type) ? 10
          : r.type === "village" ? 12 : 14,
        address_details: r.address,
      }));
      processed.sort((a, b) => {
        if (a.type === "País" && b.type !== "País") return -1;
        if (b.type === "País" && a.type !== "País") return 1;
        if (a.type === "Cidade" && b.type !== "Cidade") return -1;
        if (b.type === "Cidade" && a.type !== "Cidade") return 1;
        return (b.importance || 0) - (a.importance || 0);
      });
      setResults(processed);
    } catch (e) {
      if (!cancelledRef.current) setResults([]);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  // Stable debounce wrapper.
  const debouncedRef = useRef(debounce((q) => search(q), 300));
  useEffect(() => () => debouncedRef.current.cancel(), []);

  useEffect(() => {
    cancelledRef.current = false;
    return () => { cancelledRef.current = true; };
  }, []);

  const setQueryDebounced = useCallback((q) => {
    setQuery(q);
    debouncedRef.current(q);
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setLoading(false);
  }, []);

  return { query, results, loading, setQuery: setQueryDebounced, clear, search };
}

/** Extract (country, city) from a Nominatim result for marker setup. */
export function extractLocationInfo(result) {
  const address = result.address || {};
  let country = address.country || (address.country_code || "").toUpperCase();
  let city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    "";
  return { country, city };
}
