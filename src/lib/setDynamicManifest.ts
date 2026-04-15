/**
 * Dynamic PWA branding per church (multi-tenant).
 *
 * - Android/Chrome: generates a blob-based manifest.json dynamically so the
 *   install prompt uses the church's own name and logo.
 * - iOS/Safari: injects <link rel="apple-touch-icon"> dynamically.
 * - Favicon is also updated.
 *
 * IMPORTANT: index.html starts with <link rel="manifest" id="dynamic-manifest">
 * pointing to the static fallback. After login we replace it with a blob URL.
 */

export function setDynamicManifest(
  churchId: string,
  logoUrl?: string,
  churchName?: string,
) {
  /* ── 1. Android: dynamic manifest via blob URL ── */
  const manifestEl = document.getElementById("dynamic-manifest") as HTMLLinkElement | null;

  if (manifestEl) {
    const name = churchName || "Igreja Conectada";
    const iconSrc = logoUrl
      ? `${logoUrl}?v=${Date.now()}`
      : "/icons/icon-512x512.png";

    const manifest = {
      name,
      short_name: name.length > 12 ? name.slice(0, 12) : name,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#1e3a5f",
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

    // Revoke previous blob URL if any
    const prev = manifestEl.getAttribute("data-blob-url");
    if (prev) {
      try { URL.revokeObjectURL(prev); } catch {}
    }

    manifestEl.setAttribute("href", blobUrl);
    manifestEl.setAttribute("data-blob-url", blobUrl);

    console.log("✅ Manifest dinâmico gerado para:", name);
  }

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
    localStorage.setItem("churchName", churchName || "Igreja Conectada");

    // Also update favicon
    const favicon = document.getElementById("dynamic-favicon") as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = `${logoUrl}?v=${Date.now()}`;
    }
  }

  /* ── 3. Controlled one-time reload for Safari icon caching ── */
  const reloadKey = `pwaIconReloaded_${churchId}`;
  if (logoUrl && !localStorage.getItem(reloadKey)) {
    localStorage.setItem(reloadKey, "true");
    console.log("✅ Apple-touch-icon atualizado, recarregando para fixar ícone iOS...");
    setTimeout(() => window.location.reload(), 300);
    return;
  }

  console.log("✅ PWA branding atualizado", logoUrl ? `| icon: ${logoUrl}` : "");
}
