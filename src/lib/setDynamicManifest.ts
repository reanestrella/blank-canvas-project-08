export function setDynamicManifest(churchId: string, logoUrl?: string) {
  // 1. Manifest dinâmico (Android/Desktop)
  const manifestUrl = `https://ycaiusoyqoeccmmixgrf.supabase.co/functions/v1/manifest?id=${churchId}`;

  let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = manifestUrl;

  // 2. Apple-touch-icon dinâmico (iOS Safari)
  if (logoUrl) {
    const existing = document.querySelector("link[rel='apple-touch-icon']");
    if (existing) existing.remove();

    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = `${logoUrl}?v=${Date.now()}`;
    document.head.appendChild(appleIcon);

    // Salvar para próximos carregamentos (script inline no head)
    localStorage.setItem("churchLogo", logoUrl);
  }

  // 3. Reload controlado uma única vez para garantir que Safari capture o ícone
  const reloadKey = `pwaIconReloaded_${churchId}`;
  if (logoUrl && !localStorage.getItem(reloadKey)) {
    localStorage.setItem(reloadKey, "true");
    console.log("✅ Manifest atualizado, recarregando para fixar ícone iOS...");
    setTimeout(() => window.location.reload(), 300);
    return;
  }

  console.log("✅ Manifest atualizado:", manifestUrl, logoUrl ? `| icon: ${logoUrl}` : "");
}
