import axios from 'axios';

// =============================================
// API Configuration
// =============================================

// Em producao, o baseURL aponta para https://globememories.com/api
// O Nginx faz rewrite de /api/X para /X antes de mandar para o backend.
// Em desenvolvimento, o baseURL aponta para http://localhost:8080 (sem /api).
const isProduction = process.env.REACT_APP_ENV === 'production' || (typeof window !== 'undefined' && window.location.protocol === 'https:');
const API_BASE_URL = isProduction
  ? ((process.env.REACT_APP_API_URL || 'https://globememories.com') + '/api')
  : (process.env.REACT_APP_API_URL || 'http://localhost:8080');
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000');

// Storage keys for different token spaces
export const STORAGE_KEYS = {
  USER: 'auth_token',
  ADMIN: 'adminToken',
  USER_DATA: 'user',
  ADMIN_DATA: 'adminUser',
};

// =============================================
// Token Management
// =============================================

export const getAuthToken = (key = STORAGE_KEYS.USER) => {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(key);
  return token && token !== 'null' && token !== 'undefined' ? token : null;
};

export const setAuthHeader = (token, key = STORAGE_KEYS.USER) => {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(key, token);
  } else {
    window.localStorage.removeItem(key);
  }
};

export const clearAuthToken = (key = STORAGE_KEYS.USER) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
  if (key === STORAGE_KEYS.USER) {
    window.localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } else if (key === STORAGE_KEYS.ADMIN) {
    window.localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
  }
};

export const clearAllAuth = () => {
  clearAuthToken(STORAGE_KEYS.USER);
  clearAuthToken(STORAGE_KEYS.ADMIN);
};

// =============================================
// Decode JWT (lightweight, no validation)
// =============================================
// Note: this only decodes; signature is verified server-side.

export const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (e) {
    return null;
  }
};

export const getRole = (key = STORAGE_KEYS.USER) => {
  const token = getAuthToken(key);
  const decoded = decodeJwt(token);
  return decoded?.role || decoded?.['https://globe-memories/role'] || null;
};

// =============================================
// Axios Instance
// =============================================

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================
// Request Interceptor
// =============================================

axiosInstance.interceptors.request.use(
  (config) => {
    // Pick the right token based on the URL path
    const isAdminRequest = typeof config.url === 'string' && config.url.includes('/admin/');
    const key = isAdminRequest ? STORAGE_KEYS.ADMIN : STORAGE_KEYS.USER;
    const token = getAuthToken(key);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================
// Response Interceptor
// =============================================

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAdminRequest = typeof url === 'string' && url.includes('/admin/');

    if (status === 401) {
      // Token invalid or expired for the current namespace
      if (typeof window !== 'undefined') {
        if (isAdminRequest) {
          clearAuthToken(STORAGE_KEYS.ADMIN);
          // Don't redirect the user app if the failure was on the admin namespace
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        } else {
          clearAuthToken(STORAGE_KEYS.USER);
          if (!window.location.pathname.startsWith('/admin')) {
            window.location.href = '/login';
          }
        }
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { isAdmin: isAdminRequest } }));
      }
    }

    if (status === 403 && process.env.NODE_ENV === 'development') {
      console.error('Acesso negado:', error.response.data);
    }

    // Round 57 — the JwtAuthFilter rejects banned users with 403 +
    // { code: "ACCOUNT_BANNED", message: "Conta suspensa: <reason>" }.
    // Round 58 — also handles ACCOUNT_DELETED when an admin removed
    // the account while the user still holds a valid token.
    // When an already-logged-in user gets banned mid-session, we want
    // to (1) log them out of the right namespace, (2) surface a toast
    // so they understand what happened, and (3) redirect to /login.
    const data = error.response?.data || {};
    if (status === 403 && (data.code === 'ACCOUNT_BANNED' || data.code === 'ACCOUNT_DELETED')) {
      const reason = data.code === 'ACCOUNT_DELETED' ? 'deleted' : 'banned';
      if (typeof window !== 'undefined') {
        if (isAdminRequest) {
          clearAuthToken(STORAGE_KEYS.ADMIN);
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        } else {
          clearAuthToken(STORAGE_KEYS.USER);
          if (!window.location.pathname.startsWith('/admin')) {
            window.location.href = '/login';
          }
        }
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { isAdmin: isAdminRequest, reason, message: data.message },
        }));
      }
    }

    if (status === 500 && process.env.NODE_ENV === 'development') {
      console.error('Erro no servidor:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// =============================================
// Request Helper
// =============================================

/**
 * Make an authenticated request. Supports `params` for query strings and `signal`
 * for cancellation via AbortController.
 */
export const request = (method, url, data, options = {}) => {
  const { params, signal, headers, timeout } = options;
  const config = {
    method,
    url,
    headers: { ...(headers || {}) },
  };
  if (params) config.params = params;
  if (signal) config.signal = signal;
  if (timeout) config.timeout = timeout;
  if (data !== undefined) config.data = data;
  return axiosInstance(config);
};

// =============================================
// Media / Files Utilities
// =============================================
// Re-exported from utils/mediaUrl so the test file can import them
// without dragging in axios (which has ESM syntax CRA's Jest setup
// doesn't transform by default).
export { BASE_FILES_URL, toFullMediaUrl, getUserAvatar } from './utils/mediaUrl';

/**
 * Upload a single file to a backend media endpoint using multipart/form-data.
 * The field name is "file" as required by all media upload endpoints.
 *
 * IMPORTANT: We must NOT send `Content-Type: application/json` (the default
 * set on `axiosInstance`). If we let that default through, axios serialises
 * the FormData as JSON, Spring sees no `multipart/form-data` boundary, and
 * throws `MultipartException: Current request is not a multipart request`.
 *
 * Setting `Content-Type: undefined` inside `headers` is not enough because
 * axios merges the request headers over the instance defaults — `undefined`
 * is treated as "do not override", not as "delete this header". So we
 * strip it via `transformRequest`, and we ALSO delete it from the
 * post-merge `config.headers` so the request interceptor (which runs
 * after the merge) cannot re-add it. The browser then sets the
 * `multipart/form-data; boundary=…` header itself.
 */
export const uploadFile = (url, file, onUploadProgress, extraFields) => {
  const form = new FormData();
  form.append('file', file);
  // Round 62 — The wizard now sends a per-photo `caption` together
  // with the file so the backend can persist the caption in the
  // same transaction as the photo (instead of dropping it because
  // the POST /trips only carries the placeholder photo path). The
  // extra fields are appended as plain strings — Spring binds them
  // to @RequestParam on the TripMediaController.uploadTripPhoto
  // method. We only append non-blank values to avoid sending an
  // explicit empty `caption=` parameter (Spring would still accept
  // it, but a missing param triggers the `required = false` branch
  // more cleanly).
  if (extraFields && typeof extraFields === 'object') {
    for (const [key, value] of Object.entries(extraFields)) {
      if (value == null) continue;
      const str = String(value);
      if (!str) continue;
      form.append(key, str);
    }
  }
  return axiosInstance({
    method: 'POST',
    url,
    data: form,
    onUploadProgress,
    transformRequest: (data, headers) => {
      if (headers) {
        delete headers['Content-Type'];
        delete headers['content-type'];
      }
      return data;
    },
  });
};

export default axiosInstance;
