import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreManifestFromCache } from "./lib/setDynamicManifest";

// Restore manifest from localStorage BEFORE anything else
// so Chrome sees a valid manifest on reload after login
restoreManifestFromCache();

// Capture PWA install prompt — keep reference for InstallButton
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  console.log("✅ beforeinstallprompt captured");
});

createRoot(document.getElementById("root")!).render(<App />);

// Service Worker: apenas em produção fora de iframe
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}
