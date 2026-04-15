/**
 * Dynamic PWA branding per church (multi-tenant).
 *
 * Android/Chrome: creates a <link rel="manifest"> with a blob URL so the
 * install prompt uses the church's own name and logo.
 * iOS/Safari: injects <link rel="apple-touch-icon"> dynamically.
 * Favicon is also updated.
 *
 * IMPORTANT: index.html has NO manifest link. It is created here after login.
 */

export function setDynamicManifest(
  churchId: string,
  logoUrl?: string,
  churchName?: string,
) {
  /* ── 1. Android: dynamic manifest via blob URL ── */
  const name = churchName || "Igreja Conectada";
  const iconSrc = logoUrl
    ? `${logoUrl}?v=${Date.now()}&android=true`
    : "/icons/icon-512x512.png";

  const manifest = {
    name,
    short_name: name.length > 12 ? name.slice(0, 12) : name,
    start_url: "/",
    scope: "/",
    display: "standalone" as const,
    background_color: "#ffffff",
    theme_color: "#1e3a5f",
    icons: [
      { src: iconSrc, sizes: "192x192", type: "image/png" },
      { src: iconSrc, sizes: "512x512", type: "image/png" },
    ],
  };

  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/json",
  });
  const blobUrl = URL.createObjectURL(blob);

  // Remove any existing manifest link
  const oldManifest = document.querySelector("link[rel='manifest']");
  if (oldManifest) {
    const prevBlob = oldManifest.getAttribute("data-blob-url");
    if (prevBlob) {
      try { URL.revokeObjectURL(prevBlob); } catch {}
    }
    oldManifest.remove();
  }

  // Create fresh manifest link
  const manifestLink = document.createElement("link");
  manifestLink.rel = "manifest";
  manifestLink.href = blobUrl;
  manifestLink.setAttribute("data-blob-url", blobUrl);
  document.head.appendChild(manifestLink);

  console.log("✅ Manifest dinâmico gerado para:", name);

  // Persist manifest data for early injection on next load
  localStorage.setItem("pwaManifest", JSON.stringify(manifest));

  /* ── 2. iOS: apple-touch-icon ── */
  if (logoUrl) {
    const existing = document.querySelector("link[rel='apple-touch-icon']");
    if (existing) existing.remove();

    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = `${logoUrl}?v=${Date.now()}&ios=true`;
    document.head.appendChild(appleIcon);

    // Persist for early injection on next load (before React boots)
    localStorage.setItem("churchLogo", logoUrl);
    localStorage.setItem("churchName", name);

    // Also update favicon
    const favicon = document.getElementById("dynamic-favicon") as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = `${logoUrl}?v=${Date.now()}`;
    }
  }

  /* ── 3. Controlled one-time reload so browser picks up new manifest/icon ── */
  const reloadKey = `pwaBrandingReloaded_${churchId}`;
  if (!localStorage.getItem(reloadKey)) {
    localStorage.setItem(reloadKey, "true");
    console.log("✅ PWA branding definido, recarregando para Chrome/Safari capturar...");
    setTimeout(() => window.location.reload(), 300);
    return;
  }

  console.log("✅ PWA branding atualizado", logoUrl ? `| icon: ${logoUrl}` : "");
}

/**
 * Called early from index.html inline script or main.tsx to restore
 * the manifest from localStorage before React boots. This ensures
 * Chrome sees a valid manifest from the very first paint after reload.
 */
export function restoreManifestFromCache() {
  const cached = localStorage.getItem("pwaManifest");
  if (!cached) return;

  try {
    const manifest = JSON.parse(cached);
    const blob = new Blob([JSON.stringify(manifest)], {
      type: "application/json",
    });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = blobUrl;
    link.setAttribute("data-blob-url", blobUrl);
    document.head.appendChild(link);

    console.log("✅ Manifest restaurado do cache para:", manifest.name);
  } catch {
    // ignore malformed cache
  }
}
