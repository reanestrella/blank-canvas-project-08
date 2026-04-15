import { Bell, Search, User, Menu, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { profile, church, signOut, roles, user } = useAuth();
  const displayName = profile?.full_name || user?.email || "Usuário";
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profile?.church_id);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getRoleLabel = () => {
    if (roles.some((r) => r.role === "pastor")) return "Administrador";
    if (roles.some((r) => r.role === "tesoureiro")) return "Tesoureiro(a)";
    if (roles.some((r) => r.role === "secretario")) return "Secretário(a)";
    if (roles.some((r) => r.role === "lider_celula")) return "Líder de Célula";
    if (roles.some((r) => r.role === "lider_ministerio")) return "Líder de Ministério";
    return "Membro";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `Há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Há ${days}d`;
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-4 md:px-6" style={{ height: "70px" }}>
      <div className="flex items-center justify-between gap-4 h-full">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros, células, eventos..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-secondary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-secondary text-secondary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Marcar todas
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm flex-1">{n.member_name}</span>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {n.message || n.alert_type}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(n.created_at)}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.full_name ? getInitials(profile.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{getRoleLabel()}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{displayName}</span>
                  {church && (
                    <span className="text-xs font-normal text-muted-foreground">{church.name}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/perfil")}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
