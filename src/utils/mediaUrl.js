// Pure helpers for media URL handling. Kept in a separate file from
// `axios_helper.js` so the latter's axios import doesn't leak into
// unit tests (axios uses ESM syntax that CRA's Jest setup skips
// transforming).
//
// The expected base URL for the file-serving controller. Pulled from
// the backend's `/files/**` Spring mapping. Mirrors the production/
// dev switch in `axios_helper.js`: in production we hit the public
// HTTPS domain, in dev we hit the local Spring Boot port. Falls back
// to localhost so unit tests and SSR keep working.
const isProduction = process.env.REACT_APP_ENV === 'production'
  || (typeof window !== 'undefined' && window.location.protocol === 'https:');
export const API_BASE_URL = isProduction
  ? (process.env.REACT_APP_API_URL || 'https://globememories.com')
  : (process.env.REACT_APP_API_URL || 'http://localhost:8080');

export const BASE_FILES_URL = `${API_BASE_URL}/files`;

/**
 * Round 92 (perf) — REMOVED ALL THUMBNAILS.
 *
 * The previous design generated 3 thumbnail sizes (320/640/1024)
 * for every photo and had the frontend pick the smallest one. The
 * user's feedback was that the photos looked pixelated / low-quality
 * even on a high-DPR display, and the LCP was still 3+ seconds.
 *
 * New design: the backend optimises every upload to a single
 * high-quality JPEG (max 2560px, quality 0.90) and the frontend
 * uses that single file for everything. The browser caches it
 * across the app via the Nginx `expires 30d` header, and CSS
 * handles the responsive sizing. A 2560px JPEG @ 0.90 is typically
 * 400-900 KB — fine for a single download on a fast connection,
 * and it never looks pixelated regardless of how the browser
 * scales it.
 *
 * The `toFullMediaThumb` and `toFullMediaSrcSet` functions are kept
 * as no-ops that return the original URL, so existing callers don't
 * break. New code should just use `toFullMediaUrl` directly.
 */
export const THUMB_WIDTHS = [];

/**
 * No-op kept for backward compatibility. Returns the original URL
 * (same as `toFullMediaUrl`). The width argument is ignored.
 */
export const toFullMediaThumb = (path, _opts) => toFullMediaUrl(path);

/**
 * No-op kept for backward compatibility. Returns null — the
 * `<img>` element should not use a srcset attribute.
 */
export const toFullMediaSrcSet = (_path, _opts) => null;

/** Strip the file extension from a relative path. */
function stripExt(path) {
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  if (dot > slash) return path.substring(0, dot);
  return path;
}

/**
 * Convert a relative fileUrl returned by the backend (e.g.
 * "trip-photos/abc.jpg") to a full public URL suitable for use in
 * <img src> or <video src>.
 *
 * Returns null for falsy input. Passes through already-absolute
 * URLs unchanged. When `bustCache` is true a `?v=<timestamp>`
 * query string is appended so the browser doesn't serve a stale
 * cached image after the user uploads a new photo of the same
 * path.
 */
export const toFullMediaUrl = (path, { bustCache = false } = {}) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return bustCache ? `${path}${path.includes('?') ? '&' : '?'}v=${Date.now()}` : path;
  }
  const url = `${BASE_FILES_URL}/${path}`;
  return bustCache ? `${url}?v=${Date.now()}` : url;
};

/**
 * Resolve a user's avatar URL regardless of which field the caller
 * uses. The codebase historically exposes two aliases:
 *   - `profilePhoto`  — the canonical field returned by the backend
 *   - `profilePicture` — a frontend alias some pages introduced
 *
 * `profilePhoto` wins when both are set. The returned URL is
 * always the fully-qualified public URL.
 */
export const getUserAvatar = (user, { bustCache = false } = {}) => {
  if (!user) return null;
  const path = user.profilePhoto || user.profilePicture;
  return toFullMediaUrl(path, { bustCache });
};
