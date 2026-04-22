import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type MinimalUser = Pick<User, "id" | "email" | "user_metadata">;

const getMetadataString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function getUserDisplayName(user?: Pick<User, "email" | "user_metadata"> | null) {
  const metadata = user?.user_metadata ?? {};
  return (
    getMetadataString(metadata.full_name) ??
    getMetadataString(metadata.name) ??
    getMetadataString(user?.email)?.split("@")[0] ??
    "Usuário"
  );
}

export async function ensureUserProfile(user: MinimalUser) {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    console.error("[AuthProfile] failed to fetch existing profile:", existingProfileError);
    throw existingProfileError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const payload = {
    user_id: user.id,
    email: user.email ?? "",
    full_name: getUserDisplayName(user),
    phone: getMetadataString(user.user_metadata?.phone),
    church_id: null,
    registration_status: "ativo",
  } as const;

  const { error: insertError } = await supabase.from("profiles").insert(payload as never);

  if (insertError) {
    console.error("[AuthProfile] failed to create profile:", insertError);
    throw insertError;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[AuthProfile] failed to ensure profile:", error);
    throw error;
  }

  return data;
}

export function getInviteTokenFromRedirect(redirect?: string | null) {
  if (!redirect) return null;

  try {
    const decoded = decodeURIComponent(redirect);
    const url = new URL(decoded, window.location.origin);
    return url.searchParams.get("token")?.trim() || null;
  } catch {
    try {
      const decoded = decodeURIComponent(redirect);
      const query = decoded.includes("?") ? decoded.split("?")[1] : decoded;
      return new URLSearchParams(query).get("token")?.trim() || null;
    } catch {
      return null;
    }
  }
}

export async function clearAuthBrowserCache() {
  try {
    if (typeof window === "undefined") return;

    if ("caches" in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));
    }
  } catch (error) {
    console.error("[AuthProfile] cache cleanup failed:", error);
  }
}