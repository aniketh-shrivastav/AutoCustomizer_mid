import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import managerReducer, {
  MANAGER_STATE_STORAGE_KEY,
  selectManagerPersistedState,
} from "./managerSlice";
import customerReducer, {
  CUSTOMER_STATE_STORAGE_KEY,
  selectCustomerPersistedState,
} from "./customerSlice";
import serviceReducer, {
  SERVICE_STATE_STORAGE_KEY,
  selectServicePersistedState,
} from "./serviceSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    manager: managerReducer,
    customer: customerReducer,
    service: serviceReducer,
  },
});

if (typeof window !== "undefined") {
  store.subscribe(() => {
    const state = store.getState();
    try {
      const managerSnapshot = selectManagerPersistedState(state.manager);
      window.localStorage.setItem(
        MANAGER_STATE_STORAGE_KEY,
        JSON.stringify(managerSnapshot)
      );
    } catch (err) {
      console.warn("Failed to persist manager state", err);
    }

    try {
      const customerSnapshot = selectCustomerPersistedState(state.customer);
      window.localStorage.setItem(
        CUSTOMER_STATE_STORAGE_KEY,
        JSON.stringify(customerSnapshot)
      );
    } catch (err) {
      console.warn("Failed to persist customer state", err);
    }

    try {
      const serviceSnapshot = selectServicePersistedState(state.service);
      window.localStorage.setItem(
        SERVICE_STATE_STORAGE_KEY,
        JSON.stringify(serviceSnapshot)
      );
    } catch (err) {
      console.warn("Failed to persist service state", err);
    }
  });
}
