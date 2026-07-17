/**
 * Capacitor-App-Bootstrap (nur wenn nativ, sonst no-op).
 * StatusBar, Safe-Area, kein störender PWA-SW in der App.
 */

import { Capacitor } from "@capacitor/core";

export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/** Einmal beim Start aufrufen */
export async function initNativeApp() {
  if (!isNativeApp()) return;

  document.documentElement.dataset.native = "yes";
  document.body.classList.add("ig-native-app");

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    // Overlay unter Statusbar — Safe-Area CSS greift
    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch {
      /* older */
    }
    try {
      await StatusBar.setBackgroundColor({ color: "#0a0c0b" });
    } catch {
      /* iOS ignores often */
    }
  } catch (e) {
    console.warn("[native] StatusBar", e);
  }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch {
    /* optional */
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
    });
  } catch {
    /* web */
  }
}
