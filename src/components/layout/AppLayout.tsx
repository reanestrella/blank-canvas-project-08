import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useChurchBranding } from "@/hooks/useChurchBranding";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";

interface AppLayoutProps {
  children: React.ReactNode;
  /** If true, the layout will block access when user has no church */
  requireChurch?: boolean;
}

export function AppLayout({ children, requireChurch = false }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, hasNoChurch } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  useChurchBranding();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-lg)]">
          <img src={APP_BRAND_LOGO} alt={APP_BRAND_NAME} className="h-14 w-auto max-w-[220px] object-contain drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" />
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only block access for admin-level pages that actually require a church
  if (hasNoChurch && requireChurch) {
    if (isSuperAdmin) {
      return <Navigate to="/master" replace />;
    }
    return <Navigate to="/registro" replace />;
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
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
