import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

type Props = {
  children: ReactNode;
  allowedRoles: string[];
};

export function RoleGuard({ children, allowedRoles }: Props) {
  const { roles, isLoading } = useAuth();

  if (isLoading) return null;

  const userRoles = roles?.map((r: any) => r.role) || [];

  const hasAccess = allowedRoles.some((role) =>
    userRoles.includes(role)
  );

  if (!hasAccess) {
    return <Navigate to="/meu-app" replace />;
  }

  return <>{children}</>;
}
