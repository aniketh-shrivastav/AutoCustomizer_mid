import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchOrders = createAsyncThunk(
  'sellerOrders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/seller/api/orders', {
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return rejectWithValue('Unauthorized');
      }
      const data = await res.json();
      if (!data.success) {
        return rejectWithValue(data.message || 'Failed to load orders');
      }
      return data.orders || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'sellerOrders/updateOrderStatus',
  async ({ orderId, newStatus, productId, itemIndex }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/seller/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newStatus, productId, itemIndex })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || 'Failed to update status');
      }
      return { orderId, newStatus, productId, itemIndex };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  orders: [],
  loading: false,
  error: null,
  updating: {},
  lastUpdated: null
};

const sellerOrdersSlice = createSlice({
  name: 'sellerOrders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOrders: (state) => {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load orders';
      })
      .addCase(updateOrderStatus.pending, (state, action) => {
        const key = `${action.meta.arg.orderId}-${action.meta.arg.productId}`;
        state.updating[key] = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { orderId, newStatus, productId, itemIndex } = action.payload;
        const order = state.orders.find(o => {
          const uniqueId = o.uniqueId || `${o.orderId}-${o.productId || ''}`;
          return uniqueId === `${orderId}-${productId}`;
        });
        if (order) {
          order.status = newStatus;
        }
        const key = `${orderId}-${productId}`;
        delete state.updating[key];
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update order';
        // Clear updating flag for all pending updates
        state.updating = {};
      });
  }
});

export const { clearError, resetOrders } = sellerOrdersSlice.actions;
export default sellerOrdersSlice.reducer;
