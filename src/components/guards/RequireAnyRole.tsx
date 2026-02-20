import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldX } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AppRole = "admin" | "pastor" | "tesoureiro" | "secretario" | "lider_celula" | "lider_ministerio" | "consolidacao" | "membro" | "member";

interface RequireAnyRoleProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

/**
 * Route guard: only renders children if the user has at least one of the allowed roles.
 * Admin/pastor always passes. Shows "sem permissão" UI if unauthorized.
 */
export function RequireAnyRole({ allowedRoles, children }: RequireAnyRoleProps) {
  const { roles, isAdmin, isLoading, user, currentChurchId } = useAuth();

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

  console.log("[RequireAnyRole] userRoles:", userRoles, "allowedRoles:", allowedRoles, "hasAccess:", hasAccess);

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md w-full">
            <CardContent className="py-10 text-center space-y-4">
              <ShieldX className="w-16 h-16 mx-auto text-destructive/60" />
              <h2 className="text-xl font-bold">Sem permissão</h2>
              <p className="text-muted-foreground">
                Você não tem acesso a esta página. Entre em contato com o administrador da igreja.
              </p>
              <Button asChild>
                <Link to="/meu-app">Ir para Meu App</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return <>{children}</>;
}
