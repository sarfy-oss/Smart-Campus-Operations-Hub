import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';

const normalizeProfile = (profile, fallbackToken = '') => {
  if (!profile) return null;

  const token = profile.token || fallbackToken || '';

  return {
    id: profile.id || '',
    token,
    username: profile.username || '',
    email: profile.email || '',
    role: profile.role || '',
  };
};

const getStoredProfile = () => normalizeProfile(authAPI.getProfile());

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    const stored = authAPI.getProfile();
    if (!stored?.token) {
      return null;
    }

    try {
      const response = await authAPI.getCurrentUser();
      const mergedProfile = normalizeProfile(
        {
          ...stored,
          ...response.data,
        },
        stored.token
      );

      authAPI.setProfile(mergedProfile);
      return mergedProfile;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          'Failed to fetch current user profile.'
      );
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: getStoredProfile(),
    loading: false,
    error: null,
  },
  reducers: {
    setUserProfile: (state, action) => {
      const currentToken = state.profile?.token || '';
      state.profile = normalizeProfile(action.payload, currentToken);
      state.error = null;
    },
    clearUserProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.profile = action.payload;
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load profile.';
      });
  },
});

export const { setUserProfile, clearUserProfile } = userSlice.actions;

export const selectCurrentUser = (state) => state.user.profile;
export const selectCurrentUserName = (state) =>
  state.user.profile?.username || 'Account';
export const selectIsAuthenticated = (state) => !!state.user.profile?.token;

export default userSlice.reducer;
