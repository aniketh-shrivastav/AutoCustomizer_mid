import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Provider, useSelector } from "react-redux";
import { store } from "./store";

const container = document.getElementById("root");
const root = createRoot(container);

function ThemeApplier() {
  const mode = useSelector((s) => s.theme.mode);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem("theme", mode);
    } catch {}
  }, [mode]);
  return null;
}

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeApplier />
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
