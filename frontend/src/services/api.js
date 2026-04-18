import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
const AUTH_STORAGE_KEY = 'auth_profile';
const LEGACY_TOKEN_KEY = 'token';
const LEGACY_USER_KEY = 'user';
const AUTH_DEBUG_ENABLED =
  process.env.NODE_ENV !== 'production' &&
  process.env.REACT_APP_AUTH_DEBUG === 'true';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT Bearer token on every request
apiClient.interceptors.request.use(
  (config) => {
    const profile = getAuthProfile();
    if (profile?.token) {
      config.headers['Authorization'] = `Bearer ${profile.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthProfile();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const clearAuthProfile = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
};

const saveAuthProfile = (profile) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));

  // Keep legacy keys for any older guards/components that still read them directly.
  if (profile?.token) {
    localStorage.setItem(LEGACY_TOKEN_KEY, profile.token);
  }
  localStorage.setItem(
    LEGACY_USER_KEY,
    JSON.stringify({
      username: profile?.username || '',
      role: profile?.role || '',
    })
  );
};

const getAuthProfile = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    clearAuthProfile();
    return null;
  }
};

/**
 * Resource API Service
 */
export const resourceAPI = {
  getAllResources: (page = 0, size = 10, sort = 'id,desc') =>
    apiClient.get('/resources', { params: { page, size, sort } }),

  getResourceById: (id) => apiClient.get(`/resources/${id}`),

  createResource: (resourceData) => apiClient.post('/resources', resourceData),

  updateResource: (id, resourceData) => apiClient.put(`/resources/${id}`, resourceData),

  deleteResource: (id) => apiClient.delete(`/resources/${id}`),

  searchResources: (keyword, page = 0, size = 10) =>
    apiClient.get('/resources/search/keyword', { params: { keyword, page, size } }),

  filterByType: (type, page = 0, size = 10) =>
    apiClient.get('/resources/filter/type', { params: { type, page, size } }),

  filterByStatus: (status, page = 0, size = 10) =>
    apiClient.get('/resources/filter/status', { params: { status, page, size } }),

  filterByLocation: (location, page = 0, size = 10) =>
    apiClient.get('/resources/filter/location', { params: { location, page, size } }),

  filterByCapacity: (capacity, page = 0, size = 10) =>
    apiClient.get('/resources/filter/capacity', { params: { capacity, page, size } }),

  filterByTypeAndCapacity: (type, capacity, page = 0, size = 10) =>
    apiClient.get('/resources/filter/type-capacity', { params: { type, capacity, page, size } }),

  getAvailableResources: () => apiClient.get('/resources/available/list'),
};

/**
 * Authentication API Service
 */
export const authAPI = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    const { token, username: uname, role } = response.data;
    if (!token) {
      throw new Error('Backend login response did not include a token');
    }
    saveAuthProfile({ token, username: uname, role });
    return response.data;
  },

  loginWithGoogle: async (token) => {
    if (!token) {
      throw new Error('Google credential token is missing');
    }
    const response = await apiClient.post('/auth/student/google', { token });
    const { token: appToken, username: uname, role } = response.data;
    if (!appToken) {
      throw new Error('Backend Google login response did not include a token');
    }
    saveAuthProfile({ token: appToken, username: uname, role });
    if (AUTH_DEBUG_ENABLED) {
      // Debug only: helps confirm storage + response shape after Google auth.
      // eslint-disable-next-line no-console
      console.log('[auth] Google login success', { username: uname, role });
    }
    return response.data;
  },

  register: (username, password) =>
    apiClient.post('/auth/register', { username, password }),

  logout: () => clearAuthProfile(),

  isAuthenticated: () => !!getAuthProfile()?.token,

  getProfile: () => getAuthProfile(),

  hasRole: (role) => {
    const p = getAuthProfile();
    return p?.role === role || (Array.isArray(p?.roles) && p.roles.includes(role));
  },

  isAdmin: () => authAPI.hasRole('ADMIN'),

  // User management (admin only)
  getUsers: () => apiClient.get('/auth/users'),

  createUser: (data) => apiClient.post('/auth/users', data),

  updateUser: (id, data) => apiClient.put(`/auth/users/${id}`, data),

  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`),
};

/**
 * Notification API Service
 */
export const notificationAPI = {
  getAll: () => apiClient.get('/notifications'),

  markRead: (id) => apiClient.put(`/notifications/${id}/read`),

  markAllRead: () => apiClient.put('/notifications/read-all'),

  create: (notification) => apiClient.post('/notifications', notification),

  delete: (id) => apiClient.delete(`/notifications/${id}`),
};

export default apiClient;
