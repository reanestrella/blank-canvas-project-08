self.addEventListener("install", () => {
  console.log("SW instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW ativo");
  event.waitUntil(self.clients.claim());
});

// Intercept fetch — never cache manifest or blob URLs
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Skip manifest, blob URLs, and chrome-extension requests
  if (
    url.includes("manifest") ||
    url.startsWith("blob:") ||
    url.startsWith("chrome-extension")
  ) {
    return; // let browser handle natively
  }
});
