import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Applies dynamic white-label branding based on the church's configuration.
 * Sets CSS custom properties on the document root for primary/secondary colors.
 */
export function useChurchBranding() {
  const { church } = useAuth();

  useEffect(() => {
    const root = document.documentElement;

    if (!church) return;

    // Access extended church fields
    const c = church as any;

    // Apply ministry name as document title
    const name = c.ministry_name || c.name;
    if (name) {
      document.title = `${name} - Gestão`;
    }

    // Apply dynamic colors if configured (expects hex like #1e3a5f)
    if (c.primary_color && c.primary_color !== '#1e3a5f') {
      const hsl = hexToHSL(c.primary_color);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--sidebar-background", adjustLightness(hsl, -5));
        root.style.setProperty("--sidebar-accent", adjustLightness(hsl, 3));
        root.style.setProperty("--sidebar-border", adjustLightness(hsl, 5));
      }
    }

    if (c.secondary_color && c.secondary_color !== '#d97706') {
      const hsl = hexToHSL(c.secondary_color);
      if (hsl) {
        root.style.setProperty("--secondary", hsl);
        root.style.setProperty("--ring", hsl);
        root.style.setProperty("--sidebar-primary", hsl);
      }
    }

    // Apply favicon from logo if available
    if (c.logo_url) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = c.logo_url;
      }
    }

    return () => {
      // Reset on unmount/church change
      root.style.removeProperty("--primary");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar-background");
      root.style.removeProperty("--sidebar-accent");
      root.style.removeProperty("--sidebar-border");
      root.style.removeProperty("--sidebar-primary");
    };
  }, [church]);
}

function hexToHSL(hex: string): string | null {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return null;
  }
}

function adjustLightness(hsl: string, amount: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return hsl;
  const newL = Math.max(0, Math.min(100, parseInt(parts[3]) + amount));
  return `${parts[1]} ${parts[2]}% ${newL}%`;
}
