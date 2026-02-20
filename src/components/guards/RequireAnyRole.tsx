import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "pastor" | "tesoureiro" | "secretario" | "lider_celula" | "lider_ministerio" | "consolidacao" | "membro" | "member";

interface RequireAnyRoleProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Route guard: only renders children if the user has at least one of the allowed roles.
 * Admin/pastor always passes. Falls back to /meu-app if unauthorized.
 */
export function RequireAnyRole({ allowedRoles, children, fallbackPath = "/meu-app" }: RequireAnyRoleProps) {
  const { roles, isAdmin, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin/pastor always have access
  if (isAdmin()) {
    return <>{children}</>;
  }

  const userRoles = roles.map(r => r.role);
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
