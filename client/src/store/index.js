import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import managerReducer, {
  MANAGER_STATE_STORAGE_KEY,
  selectManagerPersistedState,
} from "./managerSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    manager: managerReducer,
  },
});

if (typeof window !== "undefined") {
  store.subscribe(() => {
    try {
      const snapshot = selectManagerPersistedState(store.getState().manager);
      window.localStorage.setItem(
        MANAGER_STATE_STORAGE_KEY,
        JSON.stringify(snapshot)
      );
    } catch (err) {
      console.warn("Failed to persist manager state", err);
    }
  });
}
