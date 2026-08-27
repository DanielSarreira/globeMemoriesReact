import { useEffect, useState } from 'react';

/**
 * useMediaQuery — listens to a CSS media query and re-renders on change.
 *
 * Usage:
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query) {
  const getMatch = () =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches;
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    // Initial sync in case the query was created before mount.
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}
