import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProducts = createAsyncThunk(
  'sellerProducts/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/seller/api/products', {
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return rejectWithValue('Unauthorized');
      }
      const data = await res.json();
      if (!data.success) {
        return rejectWithValue(data.message || 'Failed to load products');
      }
      return data.products || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'sellerProducts/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await fetch(`/seller/delete-product/${productId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        return rejectWithValue('Failed to delete product');
      }
      return productId;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  products: [],
  loading: false,
  error: null,
  deleting: {},
  lastUpdated: null
};

const sellerProductsSlice = createSlice({
  name: 'sellerProducts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetProducts: (state) => {
      Object.assign(state, initialState);
    },
    addProductLocal: (state, action) => {
      state.products.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load products';
      })
      .addCase(deleteProduct.pending, (state, action) => {
        state.deleting[action.meta.arg] = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p._id !== action.payload);
        delete state.deleting[action.payload];
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete product';
        state.deleting = {};
      });
  }
});

export const { clearError, resetProducts, addProductLocal } = sellerProductsSlice.actions;
export default sellerProductsSlice.reducer;
