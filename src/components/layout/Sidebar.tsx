import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Heart,
  GraduationCap,
  Grid3X3,
  DollarSign,
  Calendar,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Church,
  LogOut,
  Crown,
  Handshake,
  BookOpen,
  Home,
  Armchair,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "pastor" | "tesoureiro" | "secretario" | "lider_celula" | "lider_ministerio" | "consolidacao" | "membro";

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  allowedRoles?: AppRole[];
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
  { icon: Users, label: "Secretaria", path: "/secretaria", allowedRoles: ["pastor", "secretario", "consolidacao"] },
  { icon: Heart, label: "Ministérios", path: "/ministerios", allowedRoles: ["pastor", "lider_ministerio"] },
  { icon: Grid3X3, label: "Células", path: "/celulas", allowedRoles: ["pastor", "lider_celula", "consolidacao"] },
  { icon: Handshake, label: "Consolidação", path: "/consolidacao", allowedRoles: ["pastor", "consolidacao"] },
  { icon: GraduationCap, label: "Ensino", path: "/ensino", allowedRoles: ["pastor", "secretario"] },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro", allowedRoles: ["pastor", "tesoureiro"] },
  { icon: Calendar, label: "Eventos", path: "/eventos", allowedRoles: ["pastor", "secretario", "lider_ministerio"] },
  { icon: BookOpen, label: "Discipulados", path: "/discipulados", allowedRoles: ["pastor", "secretario"] },
  { icon: Home, label: "Visitas", path: "/visitas", allowedRoles: ["pastor", "secretario"] },
  { icon: Armchair, label: "Gabinete", path: "/gabinete", allowedRoles: ["pastor", "secretario"] },
  { icon: Bell, label: "Lembretes", path: "/lembretes", allowedRoles: ["pastor", "secretario"] },
  { icon: User, label: "Meu App", path: "/meu-app" },
];

const bottomItems: MenuItem[] = [
  { icon: Settings, label: "Configurações", path: "/configuracoes", allowedRoles: ["pastor"] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { church, signOut, roles, isAdmin } = useAuth();

  const menuItems = useMemo(() => {
    if (isAdmin()) {
      return allMenuItems;
    }
    
    const userRoles = roles.map(r => r.role);
    return allMenuItems.filter(item => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.some(role => userRoles.includes(role));
    });
  }, [roles, isAdmin]);

  const filteredBottomItems = useMemo(() => {
    if (isAdmin()) {
      return bottomItems;
    }
    
    const userRoles = roles.map(r => r.role);
    return bottomItems.filter(item => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.some(role => userRoles.includes(role));
    });
  }, [roles, isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <Church className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-lg truncate max-w-[140px]">
                {church?.name || "Igreja"}
              </span>
              <span className="text-xs text-sidebar-foreground/60">Gestão Completa</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "absolute -right-3 top-6 bg-sidebar rounded-full shadow-lg"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Plan Badge */}
      {!collapsed && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-sidebar-foreground">Plano Free</span>
          </div>
          <p className="text-xs text-sidebar-foreground/60 mt-1">50 membros ativos</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/app" && location.pathname === "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item",
                isActive && "nav-item-active",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-1 border-t border-sidebar-border pt-4">
        {filteredBottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item",
                isActive && "nav-item-active",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className={cn(
            "nav-item w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-3"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
