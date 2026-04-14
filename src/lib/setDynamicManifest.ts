export function setDynamicManifest(churchId: string, logoUrl?: string) {
  // 1. Manifest dinâmico
  const manifestUrl = `https://ycaiusoyqoeccmmixgrf.supabase.co/functions/v1/manifest?id=${churchId}`;

  let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = manifestUrl;

  // 2. Apple-touch-icon dinâmico
  if (logoUrl) {
    const existing = document.querySelector("link[rel='apple-touch-icon']");
    if (existing) existing.remove();

    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = logoUrl;
    document.head.appendChild(appleIcon);
  }

  console.log("✅ Manifest atualizado:", manifestUrl, logoUrl ? `| icon: ${logoUrl}` : "");
}
