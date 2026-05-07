import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, History, Users, Trash2, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MODULE_LABELS, defaultPermissionsFor, type ModuleKey } from "@/lib/permissions";

interface UserRole {
  user_id: string;
  role: string;
  church_id: string;
  full_name?: string;
  email?: string;
  permissions?: string[] | null;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  details: any;
  created_at: string;
  user_name?: string;
}

const roleLabels: Record<string, string> = {
  pastor: "Administrador",
  tesoureiro: "Tesoureiro(a)",
  secretario: "Secretário(a)",
  lider_celula: "Líder de Célula",
  lider_ministerio: "Líder de Ministério",
  consolidacao: "Consolidação",
  membro: "Membro",
};

const roleColors: Record<string, string> = {
  pastor: "bg-primary/10 text-primary",
  tesoureiro: "bg-success/10 text-success",
  secretario: "bg-info/10 text-info",
  lider_celula: "bg-secondary/10 text-secondary",
  lider_ministerio: "bg-accent/10 text-accent-foreground",
  consolidacao: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  membro: "bg-muted text-muted-foreground",
};

export function RolesPanel({ churchId }: { churchId: string }) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState<string>("");
  const [promoteRole, setPromoteRole] = useState<string>("tesoureiro");
  const [promoting, setPromoting] = useState(false);
  const [editPermsFor, setEditPermsFor] = useState<UserRole | null>(null);
  const [editPerms, setEditPerms] = useState<ModuleKey[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const { toast } = useToast();

  // Unique users for promotion select
  const uniqueUsers = Array.from(
    new Map(userRoles.map((u) => [u.user_id, u])).values()
  );

  const handlePromote = async () => {
    if (!promoteUserId || !promoteRole) return;
    setPromoting(true);
    const perms = defaultPermissionsFor(promoteRole);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: promoteUserId, church_id: churchId, role: promoteRole as any, permissions: perms } as any);
    setPromoting(false);
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    const u = uniqueUsers.find((x) => x.user_id === promoteUserId);
    if (u) setUserRoles((prev) => [...prev, { ...u, role: promoteRole, church_id: churchId, permissions: perms }]);
    toast({ title: "Cargo adicionado!", description: "O usuário agora tem acesso ao novo módulo." });
    setPromoteOpen(false);
  };

  const openEditPerms = (ur: UserRole) => {
    setEditPermsFor(ur);
    setEditPerms((ur.permissions ?? defaultPermissionsFor(ur.role)) as ModuleKey[]);
  };

  const handleSavePerms = async () => {
    if (!editPermsFor) return;
    setSavingPerms(true);
    const { error } = await supabase
      .from("user_roles")
      .update({ permissions: editPerms } as any)
      .eq("user_id", editPermsFor.user_id)
      .eq("church_id", churchId)
      .eq("role", editPermsFor.role);
    setSavingPerms(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setUserRoles((prev) =>
      prev.map((r) =>
        r.user_id === editPermsFor.user_id && r.role === editPermsFor.role
          ? { ...r, permissions: editPerms }
          : r,
      ),
    );
    toast({ title: "Permissões atualizadas!" });
    setEditPermsFor(null);
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    if (role === "membro") {
      toast({ title: "Aviso", description: "Não é possível remover o cargo de membro base.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("church_id", churchId)
      .eq("role", role);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setUserRoles(prev => prev.filter(r => !(r.user_id === userId && r.role === role)));
      toast({ title: "Cargo removido com sucesso!" });
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role, church_id")
        .eq("church_id", churchId);

      if (roles && roles.length > 0) {
        const userIds = [...new Set(roles.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        const enriched = roles.map(r => ({
          ...r,
          full_name: profileMap.get(r.user_id)?.full_name || "Desconhecido",
          email: profileMap.get(r.user_id)?.email || "",
        }));
        setUserRoles(enriched);
      } else {
        setUserRoles([]);
      }
      setLoading(false);
    };
    fetchRoles();
  }, [churchId]);

  const loadAuditLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));
      setAuditLogs(data.map(l => ({ ...l, user_name: profileMap.get(l.user_id) || "Desconhecido" })));
    } else {
      setAuditLogs([]);
    }
    setLogsLoading(false);
  };

  // Group users by role
  const roleGroups = userRoles.reduce<Record<string, UserRole[]>>((acc, ur) => {
    if (!acc[ur.role]) acc[ur.role] = [];
    acc[ur.role].push(ur);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="roles" onValueChange={(v) => { if (v === "audit") loadAuditLogs(); }}>
      <TabsList>
        <TabsTrigger value="roles" className="gap-2">
          <Shield className="w-4 h-4" /> Cargos
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-2">
          <History className="w-4 h-4" /> Log de Ações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="roles" className="mt-4 space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setPromoteOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Adicionar cargo a usuário
          </Button>
        </div>

        <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar cargo</DialogTitle>
              <DialogDescription>Conceda um novo cargo a um usuário já existente nessa igreja.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Usuário</Label>
                <Select value={promoteUserId} onValueChange={setPromoteUserId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {uniqueUsers.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.full_name} {u.email ? `(${u.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Novo cargo</Label>
                <Select value={promoteRole} onValueChange={setPromoteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).filter(([r]) => r !== "membro").map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancelar</Button>
              <Button onClick={handlePromote} disabled={promoting || !promoteUserId}>
                {promoting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar cargo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {Object.entries(roleLabels).map(([role, label]) => {
          const users = roleGroups[role] || [];
          return (
            <Card key={role}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge className={roleColors[role]}>{label}</Badge>
                    <span className="text-muted-foreground font-normal">({users.length})</span>
                  </CardTitle>
                </div>
              </CardHeader>
              {users.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {users.map(u => (
                      <div key={`${u.user_id}-${u.role}`} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border group">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(u.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{u.full_name}</p>
                          {u.email && <p className="text-[10px] text-muted-foreground">{u.email}</p>}
                        </div>
                        {role !== "membro" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveRole(u.user_id, role)}
                            title="Remover cargo"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </TabsContent>

      <TabsContent value="audit" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" /> Histórico de Ações
            </CardTitle>
            <CardDescription>Últimas 100 ações realizadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : auditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma ação registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-sm">{log.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entity_type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details && typeof log.details === "object" ? JSON.stringify(log.details) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
