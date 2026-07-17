import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./gym-app.jsx";
import { showToast } from "./components/ui.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { initNativeApp, isNativeApp } from "./lib/nativeApp.js";

// Capacitor-iOS: StatusBar etc. (no-op im Browser)
initNativeApp().catch(() => {});

// PWA Service Worker: in der nativen App oft unnötig und kann Alt-Caches stören
const skipSw = isNativeApp();
const updateSW = skipSw
  ? () => {}
  : registerSW({
      immediate: true,
      onNeedRefresh() {
        setTimeout(() => {
          showToast("Neue Version verfügbar.", "info", {
            sticky: true,
            actionLabel: "Neu laden",
            onAction: () => updateSW(true),
          });
        }, 1800);
      },
      onRegisteredSW(_url, reg) {
        if (import.meta.env.DEV && reg) {
          reg.unregister().catch(() => {});
          if (typeof caches !== "undefined") {
            caches
              .keys()
              .then((keys) => {
                keys.forEach((k) => caches.delete(k));
              })
              .catch(() => {});
          }
        }
      },
    });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      {!skipSw ? <Analytics /> : null}
    </ErrorBoundary>
  </StrictMode>,
);
