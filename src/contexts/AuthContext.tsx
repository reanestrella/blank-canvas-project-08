import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
}

interface Church {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface UserRole {
  role: "admin" | "pastor" | "tesoureiro" | "secretario" | "lider_celula" | "lider_ministerio" | "consolidacao" | "membro" | "member";
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] event:", event, "user:", session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === "SIGNED_OUT") {
          // Clear ALL state on sign out — prevent stale church data
          setProfile(null);
          setChurch(null);
          setRoles([]);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          // Always re-fetch on SIGNED_IN / TOKEN_REFRESHED to pick up new church
          setTimeout(async () => {
            await fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setChurch(null);
          setRoles([]);
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      console.log("[Auth] fetchUserData for:", userId);
      // 1. Fetch profile — single source of church_id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData as Profile);
        
        // 2. Fetch church info ONLY if profile has church_id
        if (profileData.church_id) {
          const { data: churchData } = await supabase
            .from("churches")
            .select("id, name, logo_url")
            .eq("id", profileData.church_id)
            .single();
          
          if (churchData) {
            setChurch(churchData as Church);
          }

          // 3. Fetch roles FILTERED by this church_id
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role, church_id")
            .eq("user_id", userId)
            .eq("church_id", profileData.church_id);
          
          if (rolesData) {
            setRoles(rolesData as UserRole[]);
          } else {
            setRoles([]);
          }
        } else {
          setChurch(null);
          setRoles([]);
        }
      } else {
        setProfile(null);
        setChurch(null);
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setChurch(null);
    setRoles([]);
  };

  const hasRole = (role: UserRole["role"]) => {
    return roles.some((r) => r.role === role);
  };

  const isAdmin = () => {
    return hasRole("admin") || hasRole("pastor");
  };

  const refreshChurch = async () => {
    if (!currentChurchId) return;
    
    const { data: churchData } = await supabase
      .from("churches")
      .select("id, name, logo_url")
      .eq("id", currentChurchId)
      .single();
    
    if (churchData) {
      setChurch(churchData as Church);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
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
        isLoading,
        hasNoChurch,
        signIn,
        signOut,
        hasRole,
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
