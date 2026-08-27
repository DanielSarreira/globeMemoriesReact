/**
 * useMapState.js — single useReducer for the entire Interactive
 * Map page. Centralises every piece of UI state (mode, filters,
 * panel open/closed, search query, selected location, etc.) and
 * exposes typed action creators.
 *
 * The reducer is the ONLY place that mutates state; components
 * dispatch actions and read from the returned state. This makes
 * the data flow trivial to follow and impossible to desync.
 */
import { useCallback, useMemo, useReducer } from "react";
import { DEFAULT_MODE } from "../utils/constants";

const initialState = Object.freeze({
  // UI
  mode: DEFAULT_MODE,             // "mine" | "community"
  panelCollapsed: false,          // desktop sidebar collapsed
  mobileSheetOpen: false,         // mobile bottom sheet
  activeLayer: "basic",           // "basic" | "streets" | "terrain" | "satellite"

  // Filters (community mode only)
  filters: { following: true, public: true },

  // Search
  searchQuery: "",
  searchResults: [],
  searchMarker: null,             // { coordinates, name, country, city }
  selectedLocation: null,         // { coordinates, zoom, radius, name }

  // Magic arrow
  magicDestination: null,         // { country, city, coordinates }
  showDestinationModal: false,
  isArrowFlying: false,

  // Welcome modal — disabled (user no longer wants it).
  showWelcome: false,
  dontShowAgain: false,
});

function reducer(state, action) {
  switch (action.type) {
    // ── Mode / UI ──────────────────────────────────────────
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "TOGGLE_PANEL":
      return { ...state, panelCollapsed: !state.panelCollapsed };
    case "SET_PANEL":
      return { ...state, panelCollapsed: action.payload };
    case "OPEN_MOBILE_SHEET":
      return { ...state, mobileSheetOpen: true };
    case "CLOSE_MOBILE_SHEET":
      return { ...state, mobileSheetOpen: false };
    case "SET_ACTIVE_LAYER":
      return { ...state, activeLayer: action.payload };

    // ── Filters ────────────────────────────────────────────
    case "TOGGLE_FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.payload]: !state.filters[action.payload] },
      };

    // ── Search ─────────────────────────────────────────────
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "SET_SEARCH_MARKER":
      return { ...state, searchMarker: action.payload };
    case "CLEAR_SEARCH":
      return { ...state, searchQuery: "", searchResults: [], searchMarker: null };

    // ── Selected location (fly-to) ─────────────────────────
    case "SET_SELECTED_LOCATION":
      return { ...state, selectedLocation: action.payload };
    case "CLEAR_SELECTED_LOCATION":
      return { ...state, selectedLocation: null };

    // ── Magic arrow ────────────────────────────────────────
    case "START_MAGIC":
      return { ...state, isArrowFlying: true, magicDestination: action.payload };
    case "END_MAGIC":
      return { ...state, isArrowFlying: false, magicDestination: action.payload, showDestinationModal: true };
    case "CLOSE_DESTINATION_MODAL":
      return { ...state, showDestinationModal: false, magicDestination: null };

    // ── Welcome ────────────────────────────────────────────
    case "SHOW_WELCOME":
      return { ...state, showWelcome: true };
    case "HIDE_WELCOME":
      return { ...state, showWelcome: false };
    case "SET_DONT_SHOW_AGAIN":
      return { ...state, dontShowAgain: action.payload };

    default:
      return state;
  }
}

/**
 * @returns {{ state: typeof initialState, actions: object }}
 */
export function useMapState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Memoised action creators — stable references, safe to put in
  // dependency arrays of useEffect / useCallback downstream.
  const actions = useMemo(
    () => ({
      setMode: (mode) => dispatch({ type: "SET_MODE", payload: mode }),
      togglePanel: () => dispatch({ type: "TOGGLE_PANEL" }),
      setPanel: (open) => dispatch({ type: "SET_PANEL", payload: open }),
      openMobileSheet: () => dispatch({ type: "OPEN_MOBILE_SHEET" }),
      closeMobileSheet: () => dispatch({ type: "CLOSE_MOBILE_SHEET" }),
      setActiveLayer: (id) => dispatch({ type: "SET_ACTIVE_LAYER", payload: id }),

      toggleFilter: (id) => dispatch({ type: "TOGGLE_FILTER", payload: id }),

      setSearchQuery: (q) => dispatch({ type: "SET_SEARCH_QUERY", payload: q }),
      setSearchResults: (r) => dispatch({ type: "SET_SEARCH_RESULTS", payload: r }),
      setSearchMarker: (m) => dispatch({ type: "SET_SEARCH_MARKER", payload: m }),
      clearSearch: () => dispatch({ type: "CLEAR_SEARCH" }),

      setSelectedLocation: (loc) => dispatch({ type: "SET_SELECTED_LOCATION", payload: loc }),
      clearSelectedLocation: () => dispatch({ type: "CLEAR_SELECTED_LOCATION" }),

      startMagic: (dest) => dispatch({ type: "START_MAGIC", payload: dest }),
      endMagic: (dest) => dispatch({ type: "END_MAGIC", payload: dest }),
      closeDestinationModal: () => dispatch({ type: "CLOSE_DESTINATION_MODAL" }),

      showWelcome: () => dispatch({ type: "SHOW_WELCOME" }),
      hideWelcome: () => dispatch({ type: "HIDE_WELCOME" }),
      setDontShowAgain: (v) => dispatch({ type: "SET_DONT_SHOW_AGAIN", payload: v }),
    }),
    [],
  );

  return { state, actions };
}
