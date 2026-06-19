import axios from 'axios';

// =============================================
// API Configuration
// =============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000');

// =============================================
// Token Management
// =============================================

export const getAuthToken = () => {
  const token = window.localStorage.getItem('auth_token');
  return token && token !== 'null' ? token : null;
};

export const setAuthHeader = (token) => {
  if (token) {
    window.localStorage.setItem('auth_token', token);
  } else {
    window.localStorage.removeItem('auth_token');
  }
};

export const clearAuthToken = () => {
  window.localStorage.removeItem('auth_token');
  window.localStorage.removeItem('user');
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
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================
// Response Interceptor
// =============================================

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - Token expirado
    if (error.response?.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
    }

    // Handle 403 - Sem permissão
    if (error.response?.status === 403) {
      console.error('Acesso negado:', error.response.data);
    }

    // Handle 500 - Erro servidor
    if (error.response?.status === 500) {
      console.error('Erro no servidor:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// =============================================
// Request Helper (Legacy Support)
// =============================================

export const request = (method, url, data) => {
  const headers = {};
  const token = getAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axiosInstance({
    method,
    url,
    headers,
    data,
  });
};

// =============================================
// Media / Files Utilities
// =============================================

export const BASE_FILES_URL = `${API_BASE_URL}/files`;

/**
 * Convert a relative fileUrl returned by the backend (e.g. "trip-photos/abc.jpg")
 * to a full public URL suitable for use in <img src> or <video src>.
 * Returns null for falsy input. Passes through already-absolute URLs unchanged.
 */
export const toFullMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_FILES_URL}/${path}`;
};

/**
 * Upload a single file to a backend media endpoint using multipart/form-data.
 * The field name is "file" as required by all media upload endpoints.
 * Do NOT set Content-Type manually — axios/browser sets the multipart boundary.
 */
export const uploadFile = (url, file) => {
  const form = new FormData();
  form.append('file', file);
  return axiosInstance({
    method: 'POST',
    url,
    data: form,
    headers: {
      'Content-Type': undefined,
    },
  });
};

export default axiosInstance;