import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { getRegistrationBinding, syncSelfRegistrationProfile } from "@/lib/selfRegistration";
import { clearAuthBrowserCache, ensureUserProfile } from "@/lib/authProfile";
import { setDynamicManifest } from "@/lib/setDynamicManifest";

interface Profile {
  id: string;
  user_id: string;
  church_id: string | null;
  congregation_id?: string | null;
  member_id?: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  registration_status?: string | null;
  is_linked?: boolean | null;
}

interface Church {
  id: string;
  name: string;
  logo_url?: string | null;
  slug?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  ministry_name?: string | null;
  plan: string;
  is_active: boolean;
}

interface UserRole {
  role: "pastor" | "tesoureiro" | "secretario" | "lider_celula" | "lider_ministerio" | "consolidacao" | "membro";
  church_id: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  church: Church | null;
  roles: UserRole[];
  currentChurchId: string | null;
  isLoading: boolean;
  hasNoChurch: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole["role"]) => boolean;
  hasAnyRole: (...roles: UserRole["role"][]) => boolean;
  isAdmin: () => boolean;
  refreshChurch: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Single source of truth for church_id
  const currentChurchId = profile?.church_id ?? null;
  const hasNoChurch = !isLoading && !!user && !currentChurchId;

  const prevUserIdRef = useRef<string | null>(null);
  const initialSessionHandled = useRef(false);
  const fetchingRef = useRef(false);
  const authResolvedRef = useRef(false);
  const fetchUserData = async (userId: string) => {
    try {
      console.log("USER:", userId);
      console.log("[Auth] fetchUserData for:", userId);
      const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
      const authUser = authUserData.user;

      if (authUserError || !authUser || authUser.id !== userId) {
        console.error("[Auth] could not resolve auth user for profile sync:", authUserError);
      }

      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (profileError) {
        console.error("[Auth] Error fetching profile:", profileError);
      }

      if (!profileData && authUser) {
        console.log("[Auth] profile missing, creating fallback profile for:", userId);
        try {
          profileData = await ensureUserProfile(authUser);
        } catch (ensureError) {
          console.error("[Auth] fallback profile creation failed:", ensureError);
        }
      }

      if (profileData && !profileData.church_id && authUser) {
        const binding = getRegistrationBinding(authUser);
        if (binding.churchId) {
          console.log("[Auth] Self-healing: recovering church_id from metadata:", binding.churchId);
          try {
            const result = await syncSelfRegistrationProfile(authUser, {
              churchId: binding.churchId,
              congregationId: binding.congregationId,
              fullName: binding.fullName,
              phone: binding.phone,
              ensurePendingUser: true,
            });
            if (result.churchId) {
              const { data: fixedProfile, error: fixedProfileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .limit(1)
                .maybeSingle();
              if (fixedProfileError) {
                console.error("[Auth] error reloading healed profile:", fixedProfileError);
              } else if (fixedProfile) {
                profileData = fixedProfile;
              }
            }
          } catch (healErr) {
            console.error("[Auth] Self-healing failed:", healErr);
          }
        }
      }

      if (!profileData && authUser) {
        profileData = await ensureUserProfile(authUser).catch((error) => {
          console.error("[Auth] second profile fallback failed:", error);
          return null;
        });
      }

      if (!profileData) {
        console.error("[Auth] no profile available after fallback for user:", userId);
        setProfile(null);
        setChurch(null);
        setRoles([]);
        console.log("PROFILE:", null);
        console.log("CHURCH:", null);
        console.log("ROLES:", []);
        return;
      }

      let resolvedProfile = profileData as Profile;

      if (!resolvedProfile.member_id && resolvedProfile.church_id) {
        const emailToMatch = resolvedProfile.email || authUser?.email;
        if (emailToMatch) {
          const { data: memberMatch, error: memberMatchError } = await supabase
            .from("members")
            .select("id")
            .eq("church_id", resolvedProfile.church_id)
            .eq("email", emailToMatch)
            .limit(1)
            .maybeSingle();

          if (memberMatchError) {
            console.error("[Auth] member auto-link error:", memberMatchError);
          }

          if (memberMatch) {
            console.log("[Auth] Auto-linked member_id:", memberMatch.id);
            const { error: updateMemberError } = await supabase
              .from("profiles")
              .update({ member_id: memberMatch.id })
              .eq("user_id", userId);

            if (updateMemberError) {
              console.error("[Auth] member_id update error:", updateMemberError);
            } else {
              resolvedProfile = { ...resolvedProfile, member_id: memberMatch.id };
            }
          }
        }
      }

      setProfile(resolvedProfile);
      console.log("PROFILE:", resolvedProfile);
      console.log("CHURCH:", resolvedProfile.church_id ?? null);
      console.log("[Auth] profile loaded:", resolvedProfile);
      console.log("[Auth] church_id:", resolvedProfile.church_id);

      if (resolvedProfile.church_id) {
        const [churchResponse, rolesResponse] = await Promise.all([
          supabase
            .from("churches")
            .select("id, name, logo_url, slug, primary_color, secondary_color, ministry_name, plan, is_active")
            .eq("id", resolvedProfile.church_id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role, church_id")
            .eq("user_id", userId)
            .eq("church_id", resolvedProfile.church_id),
        ]);

        if (churchResponse.error) {
          console.error("[Auth] error fetching church:", churchResponse.error);
          setChurch(null);
        } else if (churchResponse.data) {
          setChurch(churchResponse.data as Church);
          setDynamicManifest(
            resolvedProfile.church_id,
            churchResponse.data.logo_url ?? undefined,
            churchResponse.data.name,
          );
        } else {
          setChurch(null);
        }

        if (rolesResponse.error) {
          console.error("[Auth] error fetching roles:", rolesResponse.error);
          setRoles([]);
          console.log("ROLES:", []);
        } else {
          const loadedRoles = (rolesResponse.data ?? []) as UserRole[];
          setRoles(loadedRoles);
          console.log("ROLES:", loadedRoles);
          console.log("[Auth] roles loaded:", loadedRoles.map((role) => role.role));

          const restrictedRoles = ["tesoureiro", "secretario", "pastor"];
          if (loadedRoles.some((role) => restrictedRoles.includes(role.role))) {
            localStorage.setItem("keep_logged_in", "false");
            sessionStorage.setItem("session_active", "1");
          }
        }
      } else {
        setChurch(null);
        setRoles([]);
        console.log("ROLES:", []);
      }
    } catch (error) {
      console.error("[Auth] Error fetching user data:", error);
      setChurch(null);
      setRoles([]);
      console.log("ROLES:", []);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] event:", event, "user:", session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === "SIGNED_OUT") {
          prevUserIdRef.current = null;
          initialSessionHandled.current = false;
          fetchingRef.current = false;
          authResolvedRef.current = true;
          setProfile(null);
          setChurch(null);
          setRoles([]);
          queryClient.clear();
          setIsLoading(false);
          return;
        }

        // Skip INITIAL_SESSION if getSession already handled it
        if (event === "INITIAL_SESSION" && initialSessionHandled.current) {
          return;
        }
        
        if (session?.user) {
          const newUserId = session.user.id;
          // If user changed, clear stale state immediately
          if (prevUserIdRef.current && prevUserIdRef.current !== newUserId) {
            console.log("[Auth] User changed, clearing stale state");
            setProfile(null);
            setChurch(null);
            setRoles([]);
            queryClient.clear();
          }
          prevUserIdRef.current = newUserId;

          // Avoid duplicate fetches
          if (fetchingRef.current) return;
          fetchingRef.current = true;

          // Defer to avoid deadlock inside onAuthStateChange
          setTimeout(async () => {
            await fetchUserData(newUserId);
            fetchingRef.current = false;
            authResolvedRef.current = true;
            setIsLoading(false);
          }, 0);
        } else {
          prevUserIdRef.current = null;
          setProfile(null);
          setChurch(null);
          setRoles([]);
          authResolvedRef.current = true;
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      initialSessionHandled.current = true;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check "keep logged in" preference — if not kept AND browser was closed, sign out
        const keepLoggedIn = localStorage.getItem("keep_logged_in");
        if (keepLoggedIn === "false" && !sessionStorage.getItem("session_active")) {
          console.log("[Auth] Session expired (browser closed without keep_logged_in)");
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }

        prevUserIdRef.current = session.user.id;
        if (!fetchingRef.current) {
          fetchingRef.current = true;
          await fetchUserData(session.user.id);
          fetchingRef.current = false;
        }
      }
      
      authResolvedRef.current = true;
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearAuthBrowserCache();
    setProfile(null);
    setChurch(null);
    setRoles([]);
    queryClient.clear();
  };

  const hasRole = (role: UserRole["role"]) => {
    return roles.some((r) => r.role === role);
  };

  const hasAnyRole = (...checkRoles: UserRole["role"][]) => {
    return checkRoles.some((role) => roles.some((r) => r.role === role));
  };

  const isAdmin = () => {
    return hasRole("pastor");
  };

  const refreshChurch = async () => {
    if (!currentChurchId) return;
    
    const { data: churchData, error: churchError } = await supabase
      .from("churches")
      .select("id, name, logo_url, slug, primary_color, secondary_color, ministry_name, plan, is_active")
      .eq("id", currentChurchId)
      .maybeSingle();
    
    if (churchError) {
      console.error("[Auth] refreshChurch error:", churchError);
      return;
    }
    
    if (churchData) {
      setChurch(churchData as Church);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      setIsLoading(true);
      await fetchUserData(user.id);
      authResolvedRef.current = true;
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        church,
        roles,
        currentChurchId,
        isLoading: isLoading || !authResolvedRef.current,
        hasNoChurch,
        signIn,
        signOut,
        hasRole,
        hasAnyRole,
        isAdmin,
        refreshChurch,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
