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
  Handshake,
  Bell,
  Sparkles,
  Package,
  Smartphone,
  HeartHandshake,
  Network,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { type ModuleKey, pathAllowedByPermissions } from "@/lib/permissions";

type AppRole =
  | "pastor"
  | "tesoureiro"
  | "secretario"
  | "lider_celula"
  | "lider_ministerio"
  | "consolidacao"
  | "membro"
  | "network_admin"
  | "network_finance";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  module?: ModuleKey;
  allowedRoles?: AppRole[];
}

const allMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/app",
    allowedRoles: ["pastor"],
  },
  {
    icon: Users,
    label: "Secretaria",
    path: "/secretaria",
    allowedRoles: ["pastor", "secretario", "consolidacao"],
  },
  {
    icon: Heart,
    label: "Ministérios",
    path: "/ministerios",
    allowedRoles: ["pastor", "secretario", "lider_ministerio"],
  },
  {
    icon: Grid3X3,
    label: "Células",
    path: "/celulas",
    allowedRoles: ["pastor", "lider_celula", "consolidacao", "secretario"],
  },
  {
    icon: Handshake,
    label: "Consolidação",
    path: "/consolidacao",
    allowedRoles: ["pastor", "consolidacao"],
  },
  {
    icon: GraduationCap,
    label: "Ensino",
    path: "/ensino",
    allowedRoles: ["pastor", "secretario"],
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    path: "/financeiro",
    allowedRoles: ["pastor", "tesoureiro"],
  },
  {
    icon: Calendar,
    label: "Eventos",
    path: "/eventos",
    allowedRoles: ["pastor", "secretario"],
  },
  {
    icon: HeartHandshake,
    label: "Gestão Pastoral",
    path: "/gestao-pastoral",
    allowedRoles: ["pastor"],
  },
  {
    icon: Bell,
    label: "Lembretes",
    path: "/lembretes",
    allowedRoles: ["pastor", "secretario"],
  },
  {
    icon: Sparkles,
    label: "Assistente",
    path: "/assistente",
    allowedRoles: ["pastor"],
  },
  {
    icon: Package,
    label: "Patrimônio",
    path: "/patrimonio",
    allowedRoles: ["pastor", "tesoureiro"],
  },
  {
    icon: User,
    label: "Meu App",
    path: "/meu-app",
  },
  {
    icon: Smartphone,
    label: "Gestão App",
    path: "/gestao-app",
    allowedRoles: ["pastor"],
  },
];

const bottomItems: MenuItem[] = [
  {
    icon: ShieldCheck,
    label: "Auditoria",
    path: "/auditoria",
    allowedRoles: ["pastor"],
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/configuracoes",
    allowedRoles: ["pastor"],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { church, signOut, roles, profile, currentChurchId } = useAuth();

  const loadingRoles = !roles;

  const userRoles = useMemo(() => {
    if (!roles) return [];

    return roles.map((r: any) => r.role);
  }, [roles]);

  // Aggregate granular permissions for the current church.
  // If every matching role has permissions = null (legacy/unlimited), treat as unrestricted.
  const userPermissions = useMemo(() => {
    if (!roles || !currentChurchId) return null;
    const churchRoles = roles.filter((r: any) => r.church_id === currentChurchId);
    if (churchRoles.length === 0) return null;
    // If any role has a non-null permissions array, collect all allowed modules
    const hasGranular = churchRoles.some((r: any) => Array.isArray(r.permissions));
    if (!hasGranular) return null;
    const merged = new Set<string>();
    for (const r of churchRoles as any[]) {
      if (Array.isArray(r.permissions)) {
        r.permissions.forEach((p: string) => merged.add(p));
      }
    }
    return Array.from(merged);
  }, [roles, currentChurchId]);

  // MOSTRA O BOTÃO DA REDE
 const hasNetworkAccess =
  userRoles.includes("network_admin") ||
  userRoles.includes("network_finance");

  if (loadingRoles) {
    return (
      <div className="w-64 h-screen flex items-center justify-center bg-sidebar">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hideFinancial = !!(profile as any)?.hide_financial;

  const menuItems = allMenuItems.filter((item) => {
    if (!item.allowedRoles) return true;

    // When granular permissions exist, they are the sole authority — skip the
    // hardcoded allowedRoles gate so modules added via the permissions editor
    // actually show up regardless of the role's original whitelist.
    if (userPermissions !== null) {
      return pathAllowedByPermissions(item.path, userPermissions);
    }

    return item.allowedRoles.some((role) => userRoles.includes(role));
  });

  const filteredMenuItems = hideFinancial
    ? menuItems.filter(
        (item) =>
          item.path !== "/financeiro" &&
          item.path !== "/patrimonio"
      )
    : menuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col overflow-hidden",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border min-h-[70px]">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center w-full"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
            {church?.logo_url ? (
              <img
                src={church.logo_url}
                alt={church.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Church className="w-6 h-6 text-primary" />
            )}
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground truncate max-w-[140px]">
                {church?.name || "Igreja"}
              </span>

              <span className="text-xs text-sidebar-foreground/60">
                Gestão Completa
              </span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {hasNetworkAccess && (
  <Link
    to="/rede"
    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500 text-white"
  >
    <Network className="w-5 h-5" />
    <span>Painel Rede</span>
  </Link>
)}

        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-foreground font-medium",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />

              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-3 pb-4 pt-4 space-y-1 border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent"
          >
            <item.icon className="w-5 h-5" />

            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />

          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
