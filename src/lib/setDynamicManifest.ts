/**
 * Updates the apple-touch-icon dynamically for iOS PWA support.
 * The manifest.json is kept STATIC to avoid breaking Chrome's install prompt.
 */
export function setDynamicManifest(churchId: string, logoUrl?: string) {
  // Only update apple-touch-icon (iOS) — manifest stays static for Chrome compatibility
  if (logoUrl) {
    const existing = document.querySelector("link[rel='apple-touch-icon']");
    if (existing) existing.remove();

    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = `${logoUrl}?v=${Date.now()}&ios=true`;
    document.head.appendChild(appleIcon);

    // Persist for early injection on next load
    localStorage.setItem("churchLogo", logoUrl);

    // Also update favicon
    const favicon = document.getElementById("dynamic-favicon") as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = `${logoUrl}?v=${Date.now()}`;
    }
  }

  // Controlled one-time reload so Safari captures the new icon
  const reloadKey = `pwaIconReloaded_${churchId}`;
  if (logoUrl && !localStorage.getItem(reloadKey)) {
    localStorage.setItem(reloadKey, "true");
    console.log("✅ Apple-touch-icon atualizado, recarregando para fixar ícone iOS...");
    setTimeout(() => window.location.reload(), 300);
    return;
  }

  console.log("✅ PWA branding atualizado", logoUrl ? `| icon: ${logoUrl}` : "");
}
