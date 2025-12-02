import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProfileSettings = createAsyncThunk(
  'sellerProfile/fetchProfileSettings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/seller/api/profileSettings', {
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return rejectWithValue('Unauthorized');
      }
      const data = await res.json();
      if (!data.success) {
        return rejectWithValue(data.message || 'Failed to load profile');
      }
      return data.profile;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateProfileSettings = createAsyncThunk(
  'sellerProfile/updateProfileSettings',
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await fetch('/seller/api/profileSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!data.success) {
        return rejectWithValue(data.message || 'Failed to update profile');
      }
      return profileData;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  profile: {
    storeName: '',
    ownerName: '',
    contactEmail: '',
    phone: '',
    address: ''
  },
  loading: false,
  updating: false,
  error: null,
  success: false,
  lastUpdated: null
};

const sellerProfileSlice = createSlice({
  name: 'sellerProfile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetProfile: (state) => {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfileSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchProfileSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load profile';
      })
      .addCase(updateProfileSettings.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProfileSettings.fulfilled, (state, action) => {
        state.updating = false;
        state.profile = action.payload;
        state.success = true;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateProfileSettings.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || 'Failed to update profile';
        state.success = false;
      });
  }
});

export const { clearError, clearSuccess, resetProfile } = sellerProfileSlice.actions;
export default sellerProfileSlice.reducer;
