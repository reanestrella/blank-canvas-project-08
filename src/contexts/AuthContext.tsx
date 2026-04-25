import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";
import { applyInvitationForUser } from "@/lib/authInvitation";
import { clearAuthBrowserCache, ensureUserProfile } from "@/lib/authProfile";

interface Profile {
  id: string;
  user_id: string;
  church_id: string | null;
  congregation_id?: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url?: string | null;
  member_id?: string | null;
  ministry_network_id?: string | null;
  registration_status?: string | null;
  [key: string]: unknown;
}

interface Church {
  id: string;
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  [key: string]: unknown;
}

interface UserRole {
  role: string;
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
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  refreshUserData: () => Promise<void>;
  refreshChurch: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PENDING_INVITE_KEY = "pending_invite_token";
const INVITE_APPLYING_KEY = "pending_invite_applying";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-lg)]">
        <img src={APP_BRAND_LOGO} alt={APP_BRAND_NAME} className="h-14 w-auto max-w-[220px] object-contain drop-shadow-[0_0_8px_hsl(var(--primary)/0.3)]" />
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">Carregando seu app...</p>
        <p className="text-xs text-muted-foreground">
          desenvolvido por <span className="font-semibold text-primary">{APP_BRAND_NAME.toLowerCase()}</span>
        </p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);
  const inviteInFlightRef = useRef<string | null>(null);

  const currentChurchId = profile?.church_id || roles?.[0]?.church_id || null;
  const hasNoChurch = !isLoading && !!user && !currentChurchId && roles.length === 0;

  const resetAuthState = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setChurch(null);
  };

  const applyPendingInvitationOnce = async (authUser: User) => {
    if (typeof window === "undefined") return null;

    const token = sessionStorage.getItem(PENDING_INVITE_KEY);
    console.log("TOKEN:", token);

    if (!token) return null;
    if (inviteInFlightRef.current === token) return null;
    if (sessionStorage.getItem(INVITE_APPLYING_KEY) === token) return null;

    inviteInFlightRef.current = token;
    sessionStorage.setItem(INVITE_APPLYING_KEY, token);

    try {
      const result = await applyInvitationForUser(token, authUser);
      sessionStorage.removeItem(PENDING_INVITE_KEY);
      return result;
    } catch (error) {
      console.error("[Auth] erro ao aplicar convite pendente:", error);
      return null;
    } finally {
      sessionStorage.removeItem(INVITE_APPLYING_KEY);
      inviteInFlightRef.current = null;
    }
  };

  const fetchUserData = async (authUser: User) => {
    console.log("USER:", authUser);

    try {
      await ensureUserProfile(authUser);
    } catch (error) {
      console.error("[Auth] erro garantindo profile:", error);
    }

    const inviteResult = await applyPendingInvitationOnce(authUser);

    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", authUser.id).maybeSingle(),
      supabase.from("user_roles").select("role, church_id").eq("user_id", authUser.id),
    ]);

    if (profileRes.error) {
      console.error("[Auth] erro buscando profile:", profileRes.error);
      throw profileRes.error;
    }

    if (rolesRes.error) {
      console.error("[Auth] erro buscando roles:", rolesRes.error);
      throw rolesRes.error;
    }

    let profileData = profileRes.data as Profile | null;
    const rolesData = (rolesRes.data || []) as UserRole[];
    const resolvedChurchId = profileData?.church_id || rolesData?.[0]?.church_id || inviteResult?.churchId || null;

    if (profileData && !profileData.church_id && resolvedChurchId) {
      const { error } = await supabase
        .from("profiles")
        .update({ church_id: resolvedChurchId } as never)
        .eq("user_id", authUser.id);

      if (error) {
        console.error("[Auth] erro sincronizando church_id no profile:", error);
      } else {
        profileData = { ...profileData, church_id: resolvedChurchId };
      }
    }

    let churchData: Church | null = null;

    if (resolvedChurchId) {
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .eq("id", resolvedChurchId)
        .maybeSingle();

      if (error) {
        console.error("[Auth] erro buscando igreja:", error);
      } else {
        churchData = data as Church | null;
      }
    }

    console.log("PROFILE:", profileData);
    console.log("ROLES:", rolesData);
    console.log("CHURCH:", resolvedChurchId);

    return {
      profile: profileData,
      roles: rolesData,
      church: churchData,
    };
  };

  const loadCurrentUser = async (reason: string, nextSession?: Session | null) => {
    const seq = ++loadSeqRef.current;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("[Auth] getUser error:", error);
      }

      const currentUser = data.user;

      if (!currentUser) {
        if (isMountedRef.current && seq === loadSeqRef.current) {
          resetAuthState();
        }
        return;
      }

      const activeSession = nextSession ?? (await supabase.auth.getSession()).data.session;
      const userData = await fetchUserData(currentUser);

      if (!isMountedRef.current || seq !== loadSeqRef.current) return;

      setUser(currentUser);
      setSession(activeSession);
      setProfile(userData.profile);
      setRoles(userData.roles);
      setChurch(userData.church);
      console.log("[Auth] dados carregados:", reason);
    } catch (error) {
      console.error("Erro fetchUserData:", error);
      if (isMountedRef.current && seq === loadSeqRef.current) {
        setProfile(null);
        setRoles([]);
        setChurch(null);
      }
    } finally {
      if (isMountedRef.current && seq === loadSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log("AUTH EVENT:", event);

      if (event === "INITIAL_SESSION") return;

      if (!nextSession?.user) {
        loadSeqRef.current += 1;
        resetAuthState();
        setIsLoading(false);
        return;
      }

      setUser(nextSession.user);
      setSession(nextSession);
      setIsLoading(true);

      window.setTimeout(() => {
        void loadCurrentUser(event, nextSession);
      }, 0);
    });

    void loadCurrentUser("initial");

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearAuthBrowserCache();
    resetAuthState();
    queryClient.clear();
  };

  const hasRole = (role: string) => roles.some((r) => r.role === role);
  const hasAnyRole = (...checkRoles: string[]) => roles.some((r) => checkRoles.includes(r.role));
  const isAdmin = () => hasAnyRole("pastor", "admin", "secretario");

  const refreshUserData = async () => {
    if (!user) return;
    await loadCurrentUser("manual-refresh", session);
  };

  const refreshChurch = async () => {
    if (!currentChurchId) return;

    const { data, error } = await supabase
      .from("churches")
      .select("*")
      .eq("id", currentChurchId)
      .maybeSingle();

    if (error) {
      console.error("[Auth] erro atualizando igreja:", error);
      return;
    }

    if (data) setChurch(data as Church);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      church,
      roles,
      currentChurchId,
      isLoading,
      hasNoChurch,
      isAdmin,
      hasRole,
      hasAnyRole,
      refreshUserData,
      refreshChurch,
      signIn,
      signOut,
    }),
    [user, session, profile, church, roles, currentChurchId, isLoading, hasNoChurch]
  );

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
