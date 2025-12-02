import { createSlice } from "@reduxjs/toolkit";

function getInitialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: getInitialTheme() },
  reducers: {
    setTheme(state, action) {
      state.mode = action.payload === "dark" ? "dark" : "light";
    },
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
