import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Uses localStorage
import sellerDashboardReducer from './sellerDashboardSlice';
import sellerOrdersReducer from './sellerOrdersSlice';
import sellerProductsReducer from './sellerProductsSlice';
import sellerProfileReducer from './sellerProfileSlice';

// Persist configuration
const persistConfig = {
  key: 'seller-root',
  storage,
  whitelist: ['sellerDashboard', 'sellerOrders', 'sellerProducts', 'sellerProfile'],
  // Exclude loading/error flags from persistence (they reset on app load)
  blacklist: ['loading', 'updating', 'error']
};

// Persist individual reducers
const persistedDashboardReducer = persistReducer(
  { ...persistConfig, key: 'seller-dashboard' },
  sellerDashboardReducer
);
const persistedOrdersReducer = persistReducer(
  { ...persistConfig, key: 'seller-orders' },
  sellerOrdersReducer
);
const persistedProductsReducer = persistReducer(
  { ...persistConfig, key: 'seller-products' },
  sellerProductsReducer
);
const persistedProfileReducer = persistReducer(
  { ...persistConfig, key: 'seller-profile' },
  sellerProfileReducer
);

export const store = configureStore({
  reducer: {
    sellerDashboard: persistedDashboardReducer,
    sellerOrders: persistedOrdersReducer,
    sellerProducts: persistedProductsReducer,
    sellerProfile: persistedProfileReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['sellerDashboard.lastUpdated', 'sellerOrders.lastUpdated', 'sellerProducts.lastUpdated', 'sellerProfile.lastUpdated']
      }
    })
});

export const persistor = persistStore(store);
