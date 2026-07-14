import axios from 'axios';

// =============================================
// API Configuration
// =============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
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
 * Do NOT set Content-Type manually — axios/browser sets the multipart boundary.
 */
export const uploadFile = (url, file, onUploadProgress) => {
  const form = new FormData();
  form.append('file', file);
  return axiosInstance({
    method: 'POST',
    url,
    data: form,
    headers: {
      'Content-Type': undefined,
    },
    onUploadProgress,
  });
};

export default axiosInstance;
