/**
 * MapSearch.jsx — search input with debounced Nominatim call.
 * Calls onSelect when the user picks a result.
 *
 * The search itself is in a hook in the parent so the page can
 * pass it down. This component is pure UI: input + results list.
 */
import React, { useEffect, useState } from "react";
import { Search, MapPin, Loader2, X as IconX } from "lucide-react";

const sanitize = (s) =>
  (s || "")
    .toString()
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/[<>]/g, "");

const MapSearch = ({ query, results, loading, onQueryChange, onSelect, onClear }) => {
  const [raw, setRaw] = useState(query || "");

  useEffect(() => {
    setRaw(query || "");
  }, [query]);

  const handleChange = (e) => {
    const value = sanitize(e.target.value).slice(0, 100);
    setRaw(value);
    onQueryChange(value);
  };

  return (
    <div className="gm-search">
      <div className="gm-search__input-wrap">
        <Search size={14} strokeWidth={1.75} className="gm-search__icon" />
        <input
          type="text"
          className="gm-search__input"
          placeholder="Pesquisar país, cidade..."
          value={raw}
          onChange={handleChange}
          maxLength={100}
          aria-label="Pesquisar no mapa"
        />
        {raw && (
          <button
            type="button"
            className="gm-search__clear"
            aria-label="Limpar pesquisa"
            onClick={() => {
              setRaw("");
              onClear?.();
            }}
          >
            {loading ? <Loader2 size={14} className="gm-spin" /> : <IconX size={14} />}
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="gm-search__results" role="listbox">
          {results.slice(0, 8).map((r) => (
            <li key={`${r.lat}-${r.lon}`} className="gm-search__result" role="option">
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="gm-search__result-btn"
              >
                <MapPin size={12} strokeWidth={1.75} />
                <span className="gm-search__result-text">{r.display_name}</span>
                {r.type && <span className="gm-search__result-type">{r.type}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MapSearch;
