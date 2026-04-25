import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type MinimalUser = Pick<User, "id" | "email" | "user_metadata">;

export type AuthProfileFallback = {
  id: string;
  user_id: string;
  church_id: string | null;
  congregation_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  member_id: string | null;
  ministry_network_id: string | null;
  registration_status: string;
  isFallback: true;
};

export function createFallbackProfile(user: MinimalUser): AuthProfileFallback {
  return {
    id: user.id,
    user_id: user.id,
    church_id: null,
    congregation_id: null,
    full_name: getUserDisplayName(user),
    email: user.email ?? "",
    phone: getMetadataString(user.user_metadata?.phone),
    avatar_url: null,
    member_id: null,
    ministry_network_id: null,
    registration_status: "ativo",
    isFallback: true,
  };
}

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
  const fallbackProfile = createFallbackProfile(user);

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!existingProfileError && existingProfile) {
    return existingProfile;
  }

  if (existingProfileError) {
    console.error("[AuthProfile] failed to fetch existing profile, trying upsert:", existingProfileError);
  }

  const payload = {
    user_id: user.id,
    email: user.email ?? "",
    full_name: getUserDisplayName(user),
    phone: getMetadataString(user.user_metadata?.phone),
    church_id: null,
    registration_status: "ativo",
  } as const;

  const { data: upsertedProfile, error: upsertError } = await supabase
    .from("profiles")
    .upsert(payload as never, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (upsertError) {
    console.error("[AuthProfile] failed to upsert profile, using fallback:", upsertError);
    return fallbackProfile;
  }

  if (upsertedProfile) {
    return upsertedProfile;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[AuthProfile] failed to ensure profile, using fallback:", error);
    return fallbackProfile;
  }

  return data ?? fallbackProfile;
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