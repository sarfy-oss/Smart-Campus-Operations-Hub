import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
const AUTH_STORAGE_KEY = 'auth_profile';
const LEGACY_TOKEN_KEY = 'token';
const LEGACY_USER_KEY = 'user';
const AUTH_DEBUG_ENABLED =
  process.env.NODE_ENV !== 'production' ||
  process.env.REACT_APP_AUTH_DEBUG === 'true';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/student/google',
]);

const normalizeToken = (token) => {
  const value = String(token || '').trim();
  if (!value) return '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value;
};

const normalizeRoleValue = (role) => {
  const value = String(role || '').trim().toUpperCase();
  if (!value) return '';
  return value.startsWith('ROLE_') ? value.slice(5) : value;
};

const isPublicAuthRequest = (url) => {
  if (!url) return false;

  // Handles both relative paths ('/auth/login') and absolute URLs.
  const normalizedUrl = String(url);
  for (const path of PUBLIC_AUTH_PATHS) {
    if (normalizedUrl === path || normalizedUrl.endsWith(path)) {
      return true;
    }
  }
  return false;
};

// Inject JWT Bearer token on every request
apiClient.interceptors.request.use(
  (config) => {
    if (isPublicAuthRequest(config?.url)) {
      return config;
    }

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
  const normalizedProfile = {
    ...(profile || {}),
    token: normalizeToken(profile?.token),
    role: normalizeRoleValue(profile?.role),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedProfile));

  // Keep legacy keys for any older guards/components that still read them directly.
  if (normalizedProfile.token) {
    localStorage.setItem(LEGACY_TOKEN_KEY, normalizedProfile.token);
  }
  localStorage.setItem(
    LEGACY_USER_KEY,
    JSON.stringify({
      id: normalizedProfile?.id || '',
      username: normalizedProfile?.username || '',
      email: normalizedProfile?.email || '',
      role: normalizedProfile?.role || '',
    })
  );
};

const getAuthProfile = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const normalized = {
        ...(parsed || {}),
        token: normalizeToken(parsed?.token),
        role: normalizeRoleValue(parsed?.role),
      };
      if (!normalized.token) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        // Keep storage stable if previous data contained prefixed token/role values.
        saveAuthProfile(normalized);
        return normalized;
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  const legacyToken = normalizeToken(localStorage.getItem(LEGACY_TOKEN_KEY));
  if (!legacyToken) {
    return null;
  }

  let legacyUser = {};
  const rawLegacyUser = localStorage.getItem(LEGACY_USER_KEY);
  if (rawLegacyUser) {
    try {
      legacyUser = JSON.parse(rawLegacyUser) || {};
    } catch {
      legacyUser = {};
    }
  }

  const migratedProfile = {
    id: legacyUser?.id || '',
    username: legacyUser?.username || '',
    email: legacyUser?.email || '',
    role: normalizeRoleValue(legacyUser?.role),
    token: legacyToken,
  };

  saveAuthProfile(migratedProfile);
  return migratedProfile;
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
    if (AUTH_DEBUG_ENABLED) {
      // eslint-disable-next-line no-console
      console.log('[auth] sending Google token to backend', {
        endpoint: `${API_BASE_URL}/auth/student/google`,
        tokenLength: token.length,
      });
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
      console.log('[auth] Google login success', {
        status: response.status,
        username: uname,
        role,
        savedProfile: getAuthProfile(),
      });
    }
    return response.data;
  },

  register: (username, password) =>
    apiClient.post('/auth/register', { username, password }),

  logout: () => clearAuthProfile(),

  setProfile: (profile) => {
    const merged = {
      ...(getAuthProfile() || {}),
      ...(profile || {}),
    };
    saveAuthProfile(merged);
    return merged;
  },

  isAuthenticated: () => !!getAuthProfile()?.token,

  getProfile: () => getAuthProfile(),

  getCurrentUser: () => apiClient.get('/auth/me'),

  updateMyProfile: async (data) => {
    const response = await apiClient.put('/auth/me', data);
    const mergedProfile = authAPI.setProfile(response.data);
    return mergedProfile;
  },

  changeMyPassword: (data) => apiClient.put('/auth/me/password', data),

  deleteMyAccount: () => apiClient.delete('/auth/me'),

  hasRole: (role) => {
    const p = getAuthProfile();
    if (!p) return false;

    const expected = normalizeRoleValue(role);
    const current = normalizeRoleValue(p.role);
    if (current === expected) return true;

    if (Array.isArray(p.roles)) {
      return p.roles.some((item) => normalizeRoleValue(item) === expected);
    }

    return false;
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

/**
 * Booking API Service
 */
export const bookingAPI = {
  createBooking: (data) => apiClient.post('/bookings', data),

  getMyBookings: (page = 0, size = 10) =>
    apiClient.get('/bookings/my', { params: { page, size }, timeout: 20000 }),

  getAllBookings: (page = 0, size = 10, status = null) =>
    apiClient.get('/bookings', { params: { page, size, ...(status && { status }) } }),

  getBookingById: (id) => apiClient.get(`/bookings/${id}`),

  updateBooking: (id, data) => apiClient.put(`/bookings/${id}`, data),

  updateBookingStatus: (id, data) => apiClient.put(`/bookings/${id}/status`, data),

  cancelBooking: (id) => apiClient.put(`/bookings/${id}/cancel`),

  deleteBooking: (id) => apiClient.delete(`/bookings/${id}`),
};

export default apiClient;
