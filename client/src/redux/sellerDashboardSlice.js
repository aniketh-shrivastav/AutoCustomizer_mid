import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to fetch dashboard data
export const fetchDashboard = createAsyncThunk(
  'sellerDashboard/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/seller/api/dashboard', {
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return rejectWithValue('Unauthorized');
      }
      const data = await res.json();
      if (!data.success) {
        return rejectWithValue(data.message || 'Failed to load dashboard');
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  totalSales: 0,
  totalEarnings: 0,
  totalOrders: 0,
  stockAlerts: [],
  recentOrders: [],
  statusDistribution: {},
  loading: false,
  error: null,
  lastUpdated: null
};

const sellerDashboardSlice = createSlice({
  name: 'sellerDashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetDashboard: (state) => {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.totalSales = action.payload.totalSales || 0;
        state.totalEarnings = action.payload.totalEarnings || 0;
        state.totalOrders = action.payload.totalOrders || 0;
        state.stockAlerts = action.payload.stockAlerts || [];
        state.recentOrders = action.payload.recentOrders || [];
        state.statusDistribution = action.payload.statusDistribution || {};
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load dashboard';
      });
  }
});

export const { clearError, resetDashboard } = sellerDashboardSlice.actions;
export default sellerDashboardSlice.reducer;
