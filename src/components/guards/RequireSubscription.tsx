import { Navigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Loader2 } from "lucide-react";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";

interface Props {
  children: React.ReactNode;
}

export function RequireSubscription({ children }: Props) {
  const { user, isLoading: authLoading, hasNoChurch } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const { isSubscribed, isLoading: subLoading } = useSubscription();

  // Still loading auth or subscription
  if (authLoading || (user && !hasNoChurch && subLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-lg)]">
          <img src={APP_BRAND_LOGO} alt={APP_BRAND_NAME} className="h-14 w-auto max-w-[220px] object-contain" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Super admins bypass subscription check
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Sem igreja vinculada — enviar para o onboarding existente
  if (hasNoChurch) {
    return <Navigate to="/registro" replace />;
  }

  // No active subscription — redirect to plans
  if (!isSubscribed) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
}
