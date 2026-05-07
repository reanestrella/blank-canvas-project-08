import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useChurchBranding } from "@/hooks/useChurchBranding";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";
import { TrialBanner } from "@/components/subscription/TrialBanner";
import { pathAllowedByPermissions } from "@/lib/permissions";

interface AppLayoutProps {
  children: React.ReactNode;
  requireChurch?: boolean;
}

export function AppLayout({ children, requireChurch = false }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, hasNoChurch, roles, isAdmin } = useAuth();
  const location = useLocation();
  const { isSuperAdmin } = useSuperAdmin();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useChurchBranding();

  // 🔥 CARREGA ROLE
  useEffect(() => {
    const loadRole = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setUserRole(data?.role || null);
      setLoadingRole(false);
    };

    loadRole();
  }, [user]);

  // 🔄 LOADING GERAL
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-lg)]">
          <img
            src={APP_BRAND_LOGO}
            alt={APP_BRAND_NAME}
            className="h-14 w-auto max-w-[220px] object-contain"
          />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Carregando seu app...</p>
      </div>
    );
  }

  // 🔐 SEM LOGIN
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🔄 AGUARDANDO ROLE
  if (loadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // 🚫 BLOQUEIO POR IGREJA
  if (hasNoChurch && requireChurch) {
    if (isSuperAdmin) {
      return <Navigate to="/master" replace />;
    }
    return <Navigate to="/registro" replace />;
  }

  // 🔥 PROTEÇÃO GLOBAL DO TESOUREIRO
  if (userRole === "tesoureiro") {
    const path = window.location.pathname;

    if (!path.startsWith("/app/tesouraria")) {
      return <Navigate to="/app/tesouraria" replace />;
    }
  }

  // 🔒 PROTEÇÃO POR PERMISSIONS GRANULARES (não bloqueia rotas neutras)
  const NEUTRAL_PATHS = ["/meu-app", "/perfil", "/configuracoes", "/app/tesouraria"];
  const isNeutral = NEUTRAL_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  if (!isAdmin() && !isNeutral && roles && roles.length > 0) {
    const hasLegacy = roles.some((r: any) => r.permissions == null);
    if (!hasLegacy) {
      const allPerms = Array.from(new Set(roles.flatMap((r: any) => r.permissions || [])));
      if (!pathAllowedByPermissions(location.pathname, allPerms)) {
        return <Navigate to="/meu-app" replace />;
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn("md:ml-64 transition-all duration-300")}>
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <TrialBanner />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
