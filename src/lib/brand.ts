export const APP_BRAND_NAME = "CHURCH ONEFY";
export const APP_BRAND_LOGO = "/86540b94-ef74-4f66-a100-52f8feacdc6b.png";

/**
 * Returns the canonical app URL for link generation.
 * Uses VITE_APP_URL env var, never falls back to lovable.app domains.
 */
export function getAppUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");

  const origin = window.location.origin;
  // Never use lovable preview/published domains for generated links
  if (origin.includes("lovable.app") || origin.includes("lovableproject.com")) {
    return "https://churchonefy.com";
  }
  return origin;
}