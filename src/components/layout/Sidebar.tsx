import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Heart, GraduationCap, Grid3X3, DollarSign,
  Calendar, User, Settings, ChevronLeft, ChevronRight, Church, LogOut,
  Crown, Handshake, Bell, Shield, Sparkles, Package,
  Smartphone, HeartHandshake
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Loader2 } from "lucide-react";

type AppRole =
  | "pastor"
  | "tesoureiro"
  | "secretario"
  | "lider_celula"
  | "lider_ministerio"
  | "consolidacao"
  | "membro";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  allowedRoles?: AppRole[];
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app", allowedRoles: ["pastor"] },
  { icon: Users, label: "Secretaria", path: "/secretaria", allowedRoles: ["pastor", "secretario", "consolidacao"] },
  { icon: Heart, label: "Ministérios", path: "/ministerios", allowedRoles: ["pastor", "lider_ministerio"] },
  { icon: Grid3X3, label: "Células", path: "/celulas", allowedRoles: ["pastor", "lider_celula", "consolidacao", "secretario"] },
  { icon: Handshake, label: "Consolidação", path: "/consolidacao", allowedRoles: ["pastor", "consolidacao"] },
  { icon: GraduationCap, label: "Ensino", path: "/ensino", allowedRoles: ["pastor", "secretario"] },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro", allowedRoles: ["pastor", "tesoureiro"] },
  { icon: Calendar, label: "Eventos", path: "/eventos", allowedRoles: ["pastor", "secretario"] },
  { icon: HeartHandshake, label: "Gestão Pastoral", path: "/gestao-pastoral", allowedRoles: ["pastor"] },
  { icon: Bell, label: "Lembretes", path: "/lembretes", allowedRoles: ["pastor", "secretario"] },
  { icon: Sparkles, label: "Assistente", path: "/assistente", allowedRoles: ["pastor"] },
  { icon: Package, label: "Patrimônio", path: "/patrimonio", allowedRoles: ["pastor", "tesoureiro"] },
  { icon: User, label: "Meu App", path: "/meu-app" },
  { icon: Smartphone, label: "Gestão App", path: "/gestao-app", allowedRoles: ["pastor"] },
];

const bottomItems: MenuItem[] = [
  { icon: Settings, label: "Configurações", path: "/configuracoes", allowedRoles: ["pastor"] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { church, signOut, roles, isAdmin } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();

  // 🔥 LOADING DE ROLE
  const loadingRoles = !roles;

  const userRoles = useMemo(() => {
    if (!roles) return [];
    return roles.map((r: any) => r.role);
  }, [roles]);

  // 🔥 BLOQUEIA RENDER ATÉ TER ROLE
  if (loadingRoles) {
    return (
      <div className="w-64 h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // 🔥 FILTRO CORRETO
  const menuItems = useMemo(() => {
    if (isAdmin()) return allMenuItems;

    return allMenuItems.filter((item) => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.some((role) => userRoles.includes(role));
    });
  }, [userRoles, isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-sidebar flex flex-col transition-all",
      collapsed ? "w-20" : "w-64"
    )}>

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            {church?.logo_url ? (
              <img src={church.logo_url} className="w-full h-full object-cover" />
            ) : (
              <Church />
            )}
          </div>

          {!collapsed && (
            <span className="font-bold truncate">
              {church?.name || "Igreja"}
            </span>
          )}
        </div>

        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn("nav-item", isActive && "nav-item-active")}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-3 border-t space-y-1">
        {bottomItems.map((item) => (
          <Link key={item.path} to={item.path} className="nav-item">
            <item.icon className="w-5 h-5" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <button onClick={handleSignOut} className="nav-item w-full text-red-500">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
