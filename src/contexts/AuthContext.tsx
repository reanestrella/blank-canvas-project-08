import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { clearAuthBrowserCache, ensureUserProfile } from "@/lib/authProfile";

interface Profile {
  id: string;
  user_id: string;
  church_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
  member_id?: string | null;
  [key: string]: any;
}

interface Church {
  id: string;
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  [key: string]: any;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const prevUserIdRef = useRef<string | null>(null);

  // 🔥 CORRIGIDO (fallback inteligente)
  const currentChurchId =
    profile?.church_id ||
    roles?.[0]?.church_id ||
    null;

  // 🔥 CORRIGIDO (não dispara falso positivo)
  const hasNoChurch =
    !isLoading &&
    !!user &&
    !currentChurchId &&
    roles.length === 0;

  const fetchUserData = async (userId: string) => {
    try {
      console.log("USER:", userId);

      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;

      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("*").eq("user_id", userId),
      ]);

      let profileData = profileRes.data;
      let rolesData = rolesRes.data || [];

      // 🔥 GARANTE PROFILE
     if (!profileData && authUser) {
  try {
    profileData = await ensureUserProfile(authUser);
  } catch (e) {
    console.error("Erro criando profile:", e);
    profileData = null;
  }
}

      // 🔥 DEFINE CHURCH_ID CORRETO
      let resolvedChurchId =
        profileData?.church_id ||
        rolesData?.[0]?.church_id ||
        null;

      // 🔥 FORÇA PROFILE TER CHURCH_ID
      if (profileData && !profileData.church_id && resolvedChurchId) {
        await supabase
          .from("profiles")
          .update({ church_id: resolvedChurchId })
          .eq("user_id", userId);

        profileData.church_id = resolvedChurchId;
      }

      let churchData = null;

      if (resolvedChurchId) {
        const { data } = await supabase
          .from("churches")
          .select("*")
          .eq("id", resolvedChurchId)
          .maybeSingle();

        churchData = data;
      }

      console.log("PROFILE:", profileData);
      console.log("ROLES:", rolesData);
      console.log("CHURCH:", resolvedChurchId);

      return {
        profile: profileData,
        roles: rolesData,
        church: churchData,
      };
    } catch (error) {
      console.error("Erro fetchUserData:", error);
      return { profile: null, roles: [], church: null };
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AUTH EVENT:", event);

        if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
          setProfile(null);
          setRoles([]);
          setChurch(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const userId = session.user.id;
          prevUserIdRef.current = userId;
          setIsLoading(true);

          try {
            const data = await fetchUserData(userId);

            setUser(session.user);
            setSession(session);
            setProfile(data.profile);
            setRoles(data.roles);
            setChurch(data.church);
          } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          setRoles([]);
          setChurch(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const data = await fetchUserData(session.user.id);

        setUser(session.user);
        setSession(session);
        setProfile(data.profile);
        setRoles(data.roles);
        setChurch(data.church);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearAuthBrowserCache();
    setProfile(null);
    setRoles([]);
    setChurch(null);
    queryClient.clear();
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
        isLoading,
        hasNoChurch,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
