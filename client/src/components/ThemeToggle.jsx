import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../store/themeSlice";

export default function ThemeToggle({ className }) {
  const mode = useSelector((s) => s.theme.mode);
  const dispatch = useDispatch();
  return (
    <button
      type="button"
      className={className || "theme-toggle"}
      title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      onClick={() => dispatch(toggleTheme())}
    >
      {mode === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
