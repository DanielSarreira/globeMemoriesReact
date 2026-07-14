import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useTripDraft — autosave for the trip-creation form.
 *
 * Behaviour
 * ---------
 *  - On mount, if a saved draft for this user exists, the caller can
 *    decide whether to restore it (via the `loadDraft()` callback).
 *  - Whenever the form values change, the latest snapshot is
 *    persisted to localStorage after a 1.5s debounce so we don't
 *    hammer the disk on every keystroke.
 *  - The stored value is keyed by `userId` so two users on the same
 *    browser don't see each other's drafts.
 *  - `clearDraft()` removes the entry (call this after a successful
 *    publish, on logout, or when the user explicitly discards the
 *    draft).
 *
 * Why not just a single `useEffect([values])`? Because trip-creation
 * forms have many nested fields (accommodations, transports, etc.)
 * and we want a single, debounced snapshot — not a write on every
 * individual change.
 */
const STORAGE_KEY = (userId) => `gm_trip_draft_${userId || 'anon'}`;
const DEBOUNCE_MS = 1500;

export const useTripDraft = (values, userId, { enabled = true } = {}) => {
  // Hydrated lazily from localStorage in useState's initializer so we
  // don't block the first render on a (cheap) sync read.
  const [hasSavedDraft, setHasSavedDraft] = useState(() => {
    if (!enabled || !userId || typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(STORAGE_KEY(userId)));
  });
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const timerRef = useRef(null);
  const firstRun = useRef(true);

  // Persist the latest values, debounced.
  useEffect(() => {
    if (!enabled || !userId) return undefined;
    // Skip the very first effect run so we don't immediately
    // overwrite a stored draft with the default empty form.
    if (firstRun.current) {
      firstRun.current = false;
      return undefined;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(values));
        setLastSavedAt(Date.now());
        setHasSavedDraft(true);
      } catch (e) {
        // localStorage might be full or disabled (private mode). We
        // silently swallow — the draft is best-effort.
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, enabled, userId]);

  /** Read the saved draft (parses JSON). Returns null if none. */
  const loadDraft = useCallback(() => {
    if (!enabled || !userId || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }, [enabled, userId]);

  /** Drop the saved draft (after publish / on logout). */
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY(userId));
    } catch (e) {
      // ignore
    }
    setHasSavedDraft(false);
    setLastSavedAt(null);
  }, [userId]);

  return { hasSavedDraft, lastSavedAt, loadDraft, clearDraft };
};
