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
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));

  // Keep legacy keys for any older guards/components that still read them directly.
  if (profile?.token) {
    localStorage.setItem(LEGACY_TOKEN_KEY, profile.token);
  }
  localStorage.setItem(
    LEGACY_USER_KEY,
    JSON.stringify({
      id: profile?.id || '',
      username: profile?.username || '',
      email: profile?.email || '',
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

    const expected = String(role || '').toUpperCase();
    const current = String(p.role || '').toUpperCase();
    if (current === expected) return true;

    if (Array.isArray(p.roles)) {
      return p.roles.some((item) => String(item || '').toUpperCase() === expected);
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
    apiClient.get('/bookings/my', { params: { page, size } }),

  getAllBookings: (page = 0, size = 10, status = null) =>
    apiClient.get('/bookings', { params: { page, size, ...(status && { status }) } }),

  getBookingById: (id) => apiClient.get(`/bookings/${id}`),

  updateBooking: (id, data) => apiClient.put(`/bookings/${id}`, data),

  updateBookingStatus: (id, data) => apiClient.put(`/bookings/${id}/status`, data),

  cancelBooking: (id) => apiClient.put(`/bookings/${id}/cancel`),

  deleteBooking: (id) => apiClient.delete(`/bookings/${id}`),
};

/**
 * Ticket API Service - Module C: Maintenance & Incident Ticketing
 */
export const ticketAPI = {
  // Create new ticket
  createTicket: (data) => apiClient.post('/v1/tickets', data),

  // Get all tickets (admin only)
  getAllTickets: (page = 0, size = 10) =>
    apiClient.get('/v1/tickets', { params: { page, size } }),

  // Get my reported tickets
  getMyTickets: (page = 0, size = 10) =>
    apiClient.get('/v1/tickets/my', { params: { page, size } }),

  // Get tickets assigned to me (technician)
  getAssignedTickets: (page = 0, size = 10) =>
    apiClient.get('/v1/tickets/assigned', { params: { page, size } }),

  // Get tickets by status
  getTicketsByStatus: (status, page = 0, size = 10) =>
    apiClient.get('/v1/tickets/by-status', { params: { status, page, size } }),

  // Get single ticket
  getTicketById: (id) => apiClient.get(`/v1/tickets/${id}`),

  // Update ticket status
  updateTicketStatus: (id, data) => 
    apiClient.put(`/v1/tickets/${id}/status`, data),

  // Assign technician to ticket
  assignTechnician: (id, data) => 
    apiClient.put(`/v1/tickets/${id}/assign`, data),

  // Resolve ticket with notes
  resolveTicket: (id, data) => 
    apiClient.put(`/v1/tickets/${id}/resolve`, data),

  // Delete ticket
  deleteTicket: (id) => apiClient.delete(`/v1/tickets/${id}`),

  // Search tickets
  searchTickets: (keyword, page = 0, size = 10) =>
    apiClient.get('/v1/tickets/search', { params: { keyword, page, size } }),

  // Get open tickets
  getOpenTickets: (page = 0, size = 10) =>
    apiClient.get('/v1/tickets/open', { params: { page, size } }),

  // Attachment operations
  uploadAttachment: (ticketId, formData) =>
    apiClient.post(`/v1/tickets/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAttachments: (ticketId) =>
    apiClient.get(`/v1/tickets/${ticketId}/attachments`),

  deleteAttachment: (ticketId, attachmentId) =>
    apiClient.delete(`/v1/tickets/${ticketId}/attachments/${attachmentId}`),

  // Comment operations
  addComment: (ticketId, data) =>
    apiClient.post(`/v1/tickets/${ticketId}/comments`, data),

  getComments: (ticketId) =>
    apiClient.get(`/v1/tickets/${ticketId}/comments`),

  updateComment: (ticketId, commentId, data) =>
    apiClient.put(`/v1/tickets/${ticketId}/comments/${commentId}`, data),

  deleteComment: (ticketId, commentId) =>
    apiClient.delete(`/v1/tickets/${ticketId}/comments/${commentId}`),

  getTechnicians: () =>
    apiClient.get('/v1/tickets/technicians/list'),
};

export default apiClient;
