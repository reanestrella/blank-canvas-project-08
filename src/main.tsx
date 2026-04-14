import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("SW registrado"))
      .catch((err) => console.log("Erro SW:", err));
  });
}
