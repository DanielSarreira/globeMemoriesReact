// Pure helpers for media URL handling. Kept in a separate file from
// `axios_helper.js` so the latter's axios import doesn't leak into
// unit tests (axios uses ESM syntax that CRA's Jest setup skips
// transforming).
//
// The expected base URL for the file-serving controller. Pulled from
// the backend's `/files/**` Spring mapping. We hardcode it here
// rather than reading window.location so server-side rendering and
// the test environment don't blow up.
const API_BASE_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__)
  || 'http://localhost:8080';

export const BASE_FILES_URL = `${API_BASE_URL}/files`;

/**
 * Convert a relative fileUrl returned by the backend (e.g.
 * "trip-photos/abc.jpg") to a full public URL suitable for use in
 * <img src> or <video src>.
 *
 * Returns null for falsy input. Passes through already-absolute URLs
 * unchanged. When `bustCache` is true a `?v=<timestamp>` query string
 * is appended so the browser doesn't serve a stale cached image
 * after the user uploads a new photo of the same path.
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
 * uses. The codebase historically exposes two aliases for the same
 * piece of data:
 *   - `profilePhoto`  — the canonical field returned by the backend
 *   - `profilePicture` — a frontend alias some pages introduced
 *
 * `profilePhoto` wins when both are set (it's the source of truth
 * from the backend). The returned URL is always the fully-qualified
 * public URL (handles relative paths like "profile-photos/abc.jpg").
 *
 * By default we bust the browser cache because profile photos get
 * overwritten in place (the file path stays the same, only the
 * bytes change). Pass `{ bustCache: false }` to opt out (e.g. for
 * stable URLs in <link rel> tags).
 */
export const getUserAvatar = (user, { bustCache = true } = {}) => {
  if (!user) return null;
  const path = user.profilePhoto || user.profilePicture;
  return toFullMediaUrl(path, { bustCache });
};
