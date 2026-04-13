export function setDynamicManifest(churchId: string) {
  const manifestUrl = `https://ycaiusoyqoeccmmixgrf.supabase.co/functions/v1/manifest?id=${churchId}`;

  let link = document.querySelector("link[rel='manifest']") as HTMLLinkElement;

  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }

  link.href = manifestUrl;

  console.log("✅ Manifest atualizado:", manifestUrl);
}
