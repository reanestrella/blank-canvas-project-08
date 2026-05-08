import { useState } from "react";
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
import { pathAllowedByPermissions, defaultPermissionsFor } from "@/lib/permissions";

interface AppLayoutProps {
  children: React.ReactNode;
  requireChurch?: boolean;
}

export function AppLayout({ children, requireChurch = false }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, hasNoChurch, roles } = useAuth();
  const location = useLocation();
  const { isSuperAdmin } = useSuperAdmin();

  useChurchBranding();

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

  // 🚫 BLOQUEIO POR IGREJA
  if (hasNoChurch && requireChurch) {
    if (isSuperAdmin) {
      return <Navigate to="/master" replace />;
    }
    return <Navigate to="/registro" replace />;
  }

  // 🔒 PROTEÇÃO POR PERMISSIONS GRANULARES (não bloqueia rotas neutras)
  const NEUTRAL_PATHS = ["/meu-app", "/perfil"];
  const isNeutral = NEUTRAL_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  if (!isSuperAdmin && !isNeutral && roles && roles.length > 0) {
    const hasPastor = roles.some((r: any) => r.role === "pastor");
    if (!hasPastor) {
      const allPerms = Array.from(new Set(roles.flatMap((r: any) => r.permissions ?? defaultPermissionsFor(r.role))));
      const isNetworkPath = location.pathname === "/rede" || location.pathname.startsWith("/rede/");
      const hasNetworkAccess = roles.some((r: any) => ["network_admin", "network_finance"].includes(r.role));
      if ((!isNetworkPath || !hasNetworkAccess) && !pathAllowedByPermissions(location.pathname, allPerms)) {
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
