import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import {
  Loader2, Shield, Church, Bot, Calendar, AlertTriangle,
  Users, Building2, Palette, Power, Edit2, Save, X, Plus, LogOut,
  Trash2, Network,
} from "lucide-react";

interface ChurchItem {
  id: string;
  name: string;
  slug: string | null;
  plan: string;
  is_active: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  ministry_name: string | null;
  logo_url: string | null;
  created_at: string;
  member_count?: number;
  ministry_network_id?: string | null;
}

interface ChurchFeatures {
  ai_enabled: boolean;
  ai_trial_enabled: boolean;
  ai_trial_end: string | null;
}

interface AiErrorLog {
  id: string;
  feature: string;
  error_message: string;
  provider_status: number | null;
  created_at: string;
}

interface NetworkItem {
  id: string;
  name: string;
  slug: string | null;
  is_active: boolean;
}

export default function Master() {
  const { isSuperAdmin, isChecking } = useSuperAdmin();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [networks, setNetworks] = useState<NetworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChurch, setSelectedChurch] = useState<string | null>(null);
  const [features, setFeatures] = useState<ChurchFeatures | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trialDays, setTrialDays] = useState(30);
  const [errorLogs, setErrorLogs] = useState<AiErrorLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [editingChurch, setEditingChurch] = useState<ChurchItem | null>(null);
  const [showNewChurchForm, setShowNewChurchForm] = useState(false);
  const [newChurch, setNewChurch] = useState({ name: "", email: "", full_name: "" });
  const [creating, setCreating] = useState(false);
  const [deletingChurch, setDeletingChurch] = useState<ChurchItem | null>(null);
  const [showNewNetwork, setShowNewNetwork] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState("");
  // Network leader management
  const [networkLeaders, setNetworkLeaders] = useState<any[]>([]);
  const [showAddLeader, setShowAddLeader] = useState(false);
  const [leaderForm, setLeaderForm] = useState({ email: "", network_id: "", role: "network_admin" });

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadChurches();
    loadErrorLogs();
    loadNetworks();
    loadNetworkLeaders();
  }, [isSuperAdmin]);

  const loadChurches = async () => {
    setLoading(true);
    const { data: churchesData } = await supabase
      .from("churches")
      .select("id, name, slug, plan, is_active, primary_color, secondary_color, ministry_name, logo_url, created_at, ministry_network_id")
      .order("name");

    if (churchesData) {
      const enriched = await Promise.all(
        (churchesData as any[]).map(async (c) => {
          const { count } = await supabase
            .from("members")
            .select("id", { count: "exact", head: true })
            .eq("church_id", c.id);
          return { ...c, member_count: count || 0 } as ChurchItem;
        })
      );
      setChurches(enriched);
    }
    setLoading(false);
  };

  const loadNetworks = async () => {
    const { data } = await supabase.from("ministries_network").select("id, name, slug, is_active").order("name");
    setNetworks((data as NetworkItem[]) || []);
  };

  const loadNetworkLeaders = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, ministry_network_id")
      .not("ministry_network_id", "is", null);
    setNetworkLeaders(data || []);
  };

  const handleAddLeader = async () => {
    if (!leaderForm.email.trim() || !leaderForm.network_id) {
      toast({ title: "Erro", description: "Preencha email e rede.", variant: "destructive" });
      return;
    }
    try {
      const emailTrimmed = leaderForm.email.trim();

      // Use the secure RPC that queries auth.users directly
      const { data: foundUsers, error: rpcError } = await supabase
        .rpc("find_user_by_email", { p_email: emailTrimmed });

      if (rpcError) {
        console.error("[Master] RPC error:", rpcError);
        throw new Error("Erro ao buscar usuário: " + rpcError.message);
      }

      const userData = foundUsers && foundUsers.length > 0 ? foundUsers[0] : null;

      if (!userData) {
        throw new Error(
          `Usuário com email "${emailTrimmed}" não encontrado. O usuário precisa ter se cadastrado na plataforma primeiro.`
        );
      }

      const userId = userData.user_id;
      const userChurchId = userData.church_id;

      // Ensure profile exists (some auth users may not have profiles yet)
      if (!userChurchId) {
        // Profile may exist without church_id, or not exist at all - update/create
        const { error: upsertError } = await supabase.from("profiles").upsert({
          user_id: userId,
          email: userData.email,
          full_name: userData.full_name || emailTrimmed,
          ministry_network_id: leaderForm.network_id,
        } as any, { onConflict: "user_id" });
        if (upsertError) console.warn("[Master] Profile upsert warning:", upsertError.message);
      } else {
        // Update existing profile with network link
        const { error: updateError } = await supabase.from("profiles").update({
          ministry_network_id: leaderForm.network_id,
        } as any).eq("user_id", userId);
        if (updateError) throw new Error("Erro ao vincular rede ao perfil: " + updateError.message);
      }

      // For the role, use the user's own church_id, or pick a church from the network
      let roleChurchId = userChurchId;
      if (!roleChurchId) {
        const { data: networkChurch } = await supabase
          .from("churches")
          .select("id")
          .eq("ministry_network_id", leaderForm.network_id)
          .limit(1)
          .maybeSingle();
        roleChurchId = (networkChurch as any)?.id || churches[0]?.id;
      }

      if (!roleChurchId) {
        throw new Error("Nenhuma igreja encontrada para vincular o papel. Vincule pelo menos uma igreja à rede primeiro.");
      }

      // Add role (ignore conflict if already exists)
      const roleToAssign = leaderForm.role as string;
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        church_id: roleChurchId,
        role: roleToAssign,
      } as any);

      if (roleError) {
        if (roleError.message.includes("duplicate") || roleError.code === "23505") {
          // Already has this role - that's fine
          console.log("[Master] Role already exists, skipping");
        } else {
          console.error("[Master] Role insert error:", roleError);
          throw new Error("Erro ao adicionar papel: " + roleError.message);
        }
      }

      toast({ title: "Líder adicionado!", description: `${emailTrimmed} vinculado à rede como ${userData.full_name || emailTrimmed}.` });
      setShowAddLeader(false);
      setLeaderForm({ email: "", network_id: "", role: "network_admin" });
      loadNetworkLeaders();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const loadErrorLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("ai_error_logs")
      .select("id, feature, error_message, provider_status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setErrorLogs((data as AiErrorLog[]) || []);
    setLogsLoading(false);
  };

  const loadFeatures = async (churchId: string) => {
    setFeaturesLoading(true);
    let { data } = await supabase
      .from("church_features")
      .select("ai_enabled, ai_trial_enabled, ai_trial_end")
      .eq("church_id", churchId)
      .maybeSingle();
    if (!data) {
      await supabase.from("church_features").insert({
        church_id: churchId, ai_enabled: false, ai_trial_enabled: false,
      });
      data = { ai_enabled: false, ai_trial_enabled: false, ai_trial_end: null };
    }
    setFeatures(data);
    setFeaturesLoading(false);
  };

  useEffect(() => {
    if (!selectedChurch) { setFeatures(null); return; }
    loadFeatures(selectedChurch);
  }, [selectedChurch]);

  const handleCreateChurch = async () => {
    if (!newChurch.name.trim()) {
      toast({ title: "Erro", description: "Nome da igreja é obrigatório.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      if (newChurch.email.trim()) {
        const { data, error } = await supabase.rpc("setup_new_church", {
          _church_name: newChurch.name,
          _email: newChurch.email,
          _full_name: newChurch.full_name || newChurch.email,
        });
        if (error) throw error;
        const result = data as any;
        if (result && !result.success) throw new Error(result.error || "Falha ao criar igreja");
        toast({ title: "Igreja criada!", description: `${newChurch.name} criada e admin vinculado.` });
      } else {
        const { error } = await supabase.from("churches").insert({ name: newChurch.name } as any);
        if (error) throw error;
        toast({ title: "Igreja criada!", description: `${newChurch.name} criada com sucesso.` });
      }
      setNewChurch({ name: "", email: "", full_name: "" });
      setShowNewChurchForm(false);
      loadChurches();
    } catch (e: any) {
      console.error("[Master] Create church error:", e);
      toast({ title: "Erro ao criar igreja", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChurch = async (): Promise<{ error: any }> => {
    if (!deletingChurch) return { error: "Nenhuma igreja selecionada" };
    try {
      const { data, error } = await supabase.rpc("delete_church_cascade", { p_church_id: deletingChurch.id });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Falha na exclusão");
      toast({ title: "Igreja excluída", description: `${deletingChurch.name} e todos os dados foram removidos.` });
      loadChurches();
      return { error: null };
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
      return { error: e };
    }
  };

  const handleCreateNetwork = async () => {
    if (!newNetworkName.trim()) return;
    try {
      const { error } = await supabase.from("ministries_network").insert({ name: newNetworkName } as any);
      if (error) throw error;
      toast({ title: "Rede criada!", description: newNetworkName });
      setNewNetworkName("");
      setShowNewNetwork(false);
      loadNetworks();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveFeatures = async () => {
    if (!selectedChurch || !features) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("church_features").upsert({
        church_id: selectedChurch, ai_enabled: features.ai_enabled,
        ai_trial_enabled: features.ai_trial_enabled, ai_trial_end: features.ai_trial_end,
      }, { onConflict: "church_id" });
      if (error) throw error;
      toast({ title: "Salvo", description: "Configurações de IA atualizadas." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleActivateTrial = async () => {
    if (!selectedChurch) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("enable_ai_trial", { p_church_id: selectedChurch, p_trial_days: trialDays });
      if (error) throw error;
      toast({ title: "Trial ativado", description: `Trial de ${trialDays} dias.` });
      await loadFeatures(selectedChurch);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleChurchActive = async (churchId: string, currentState: boolean) => {
    const { error } = await supabase.from("churches").update({ is_active: !currentState } as any).eq("id", churchId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: currentState ? "Igreja desativada" : "Igreja ativada" }); loadChurches(); }
  };

  const saveChurchBranding = async () => {
    if (!editingChurch) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("churches").update({
        name: editingChurch.name, ministry_name: editingChurch.ministry_name,
        primary_color: editingChurch.primary_color, secondary_color: editingChurch.secondary_color,
        plan: editingChurch.plan, logo_url: editingChurch.logo_url,
        ministry_network_id: editingChurch.ministry_network_id,
      } as any).eq("id", editingChurch.id);
      if (error) throw error;
      toast({ title: "Salvo" }); setEditingChurch(null); loadChurches();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  if (isChecking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  const totalMembers = churches.reduce((sum, c) => sum + (c.member_count || 0), 0);
  const activeChurches = churches.filter(c => c.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Painel Master</h1>
            <p className="text-xs text-muted-foreground">Gestão da Plataforma SaaS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/rede")}>
            <Network className="w-4 h-4 mr-1" /> Rede
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
            <Church className="w-4 h-4 mr-1" /> Igreja
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Building2, value: churches.length, label: "Igrejas", color: "text-primary" },
            { icon: Power, value: activeChurches, label: "Ativas", color: "text-emerald-500" },
            { icon: Users, value: totalMembers, label: "Membros Total", color: "text-secondary" },
            { icon: AlertTriangle, value: errorLogs.length, label: "Erros IA", color: "text-destructive" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <s.icon className={`w-8 h-8 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="churches" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="churches">Igrejas</TabsTrigger>
            <TabsTrigger value="networks">Redes</TabsTrigger>
            <TabsTrigger value="ai">IA</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Churches Tab */}
          <TabsContent value="churches" className="space-y-4">
            {showNewChurchForm && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Nova Igreja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Nome *</Label><Input value={newChurch.name} onChange={e => setNewChurch(p => ({ ...p, name: e.target.value }))} placeholder="Igreja Nova Aliança" /></div>
                    <div className="space-y-2"><Label>Email Admin (opcional)</Label><Input type="email" value={newChurch.email} onChange={e => setNewChurch(p => ({ ...p, email: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Nome Admin</Label><Input value={newChurch.full_name} onChange={e => setNewChurch(p => ({ ...p, full_name: e.target.value }))} /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateChurch} disabled={creating}>{creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Plus className="w-4 h-4 mr-2" /> Criar</Button>
                    <Button variant="outline" onClick={() => setShowNewChurchForm(false)}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {editingChurch && (
              <Card className="border-primary">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Palette className="w-5 h-5" /> Editar: {editingChurch.name}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nome</Label><Input value={editingChurch.name} onChange={e => setEditingChurch({ ...editingChurch, name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Ministério (white-label)</Label><Input value={editingChurch.ministry_name || ""} onChange={e => setEditingChurch({ ...editingChurch, ministry_name: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={editingChurch.primary_color || "#1e3a5f"} onChange={e => setEditingChurch({ ...editingChurch, primary_color: e.target.value })} className="w-14 h-10 p-1" />
                        <Input value={editingChurch.primary_color || "#1e3a5f"} onChange={e => setEditingChurch({ ...editingChurch, primary_color: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={editingChurch.secondary_color || "#d97706"} onChange={e => setEditingChurch({ ...editingChurch, secondary_color: e.target.value })} className="w-14 h-10 p-1" />
                        <Input value={editingChurch.secondary_color || "#d97706"} onChange={e => setEditingChurch({ ...editingChurch, secondary_color: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Logo URL</Label><Input value={editingChurch.logo_url || ""} onChange={e => setEditingChurch({ ...editingChurch, logo_url: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Plano</Label><Input value={editingChurch.plan} onChange={e => setEditingChurch({ ...editingChurch, plan: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Rede Ministerial</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingChurch.ministry_network_id || ""} onChange={e => setEditingChurch({ ...editingChurch, ministry_network_id: e.target.value || null })}>
                        <option value="">Nenhuma</option>
                        {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveChurchBranding} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Save className="w-4 h-4 mr-2" /> Salvar</Button>
                    <Button variant="outline" onClick={() => setEditingChurch(null)}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Church className="w-5 h-5" /> Todas as Igrejas</CardTitle>
                  <CardDescription>{churches.length} igrejas</CardDescription>
                </div>
                <Button onClick={() => setShowNewChurchForm(true)} disabled={showNewChurchForm}><Plus className="w-4 h-4 mr-2" /> Nova Igreja</Button>
              </CardHeader>
              <CardContent>
                {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Igreja</TableHead>
                          <TableHead>Rede</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Membros</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cores</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {churches.map(c => (
                          <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {c.logo_url ? <img src={c.logo_url} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Church className="w-4 h-4 text-muted-foreground" /></div>}
                                <div>
                                  <p className="font-medium text-sm">{c.name}</p>
                                  {c.ministry_name && <p className="text-xs text-muted-foreground">{c.ministry_name}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{networks.find(n => n.id === c.ministry_network_id)?.name || "—"}</TableCell>
                            <TableCell><Badge variant="outline">{c.plan}</Badge></TableCell>
                            <TableCell>{c.member_count}</TableCell>
                            <TableCell><Badge variant={c.is_active ? "default" : "destructive"}>{c.is_active ? "Ativa" : "Inativa"}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <div className="w-5 h-5 rounded border" style={{ backgroundColor: c.primary_color || "#1e3a5f" }} />
                                <div className="w-5 h-5 rounded border" style={{ backgroundColor: c.secondary_color || "#d97706" }} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditingChurch(c)} title="Editar"><Edit2 className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => toggleChurchActive(c.id, c.is_active)} title={c.is_active ? "Desativar" : "Ativar"}><Power className={`w-4 h-4 ${c.is_active ? "text-emerald-500" : "text-destructive"}`} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedChurch(c.id)} title="IA"><Bot className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeletingChurch(c)} title="Excluir"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Networks Tab */}
          <TabsContent value="networks" className="space-y-4">
            {showNewNetwork && (
              <Card className="border-primary">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2"><Label>Nome da Rede</Label><Input value={newNetworkName} onChange={e => setNewNetworkName(e.target.value)} placeholder="Ministério Alcançando Vidas" /></div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateNetwork}><Plus className="w-4 h-4 mr-2" /> Criar</Button>
                    <Button variant="outline" onClick={() => setShowNewNetwork(false)}>Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5" /> Redes Ministeriais</CardTitle>
                <Button onClick={() => setShowNewNetwork(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Rede</Button>
              </CardHeader>
              <CardContent>
                {networks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma rede cadastrada.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Igrejas</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {networks.map(n => (
                        <TableRow key={n.id}>
                          <TableCell className="font-medium">{n.name}</TableCell>
                          <TableCell>{churches.filter(c => c.ministry_network_id === n.id).length}</TableCell>
                          <TableCell><Badge variant={n.is_active ? "default" : "destructive"}>{n.is_active ? "Ativa" : "Inativa"}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Network Leaders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Líderes de Rede</CardTitle>
                <Button onClick={() => setShowAddLeader(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar Líder</Button>
              </CardHeader>
              <CardContent>
                {showAddLeader && (
                  <div className="mb-4 p-4 border rounded-lg border-primary space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1"><Label>Email do Usuário *</Label><Input value={leaderForm.email} onChange={e => setLeaderForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
                      <div className="space-y-1">
                        <Label>Rede *</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={leaderForm.network_id} onChange={e => setLeaderForm(f => ({ ...f, network_id: e.target.value }))}>
                          <option value="">Selecione</option>
                          {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Papel</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={leaderForm.role} onChange={e => setLeaderForm(f => ({ ...f, role: e.target.value }))}>
                          <option value="network_admin">Admin da Rede</option>
                          <option value="network_finance">Financeiro da Rede</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddLeader}><Plus className="w-4 h-4 mr-2" /> Vincular</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddLeader(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
                {networkLeaders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum líder de rede cadastrado.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Rede</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {networkLeaders.map((l: any) => (
                        <TableRow key={l.user_id}>
                          <TableCell className="font-medium">{l.full_name || "—"}</TableCell>
                          <TableCell className="text-sm">{l.email}</TableCell>
                          <TableCell><Badge variant="outline">{networks.find(n => n.id === l.ministry_network_id)?.name || "—"}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Selecionar Igreja</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {churches.map(c => (
                      <button key={c.id} onClick={() => setSelectedChurch(c.id)} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedChurch === c.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"}`}>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Plano: {c.plan} · {c.member_count} membros</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Bot className="w-5 h-5" /> Recursos de IA</CardTitle>
                  <CardDescription>{selectedChurch ? churches.find(c => c.id === selectedChurch)?.name : "Selecione uma igreja"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedChurch ? <p className="text-muted-foreground text-center py-8">Selecione uma igreja</p>
                    : featuresLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    : features ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg border">
                          <div><p className="font-medium">IA Habilitada</p><p className="text-sm text-muted-foreground">Libera todos os recursos de IA</p></div>
                          <Switch checked={features.ai_enabled} onCheckedChange={checked => setFeatures({ ...features, ai_enabled: checked })} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border">
                          <div><p className="font-medium">Trial Ativo</p><p className="text-sm text-muted-foreground">{features.ai_trial_enabled && features.ai_trial_end ? `Até: ${new Date(features.ai_trial_end).toLocaleDateString("pt-BR")}` : "Sem trial"}</p></div>
                          <Switch checked={features.ai_trial_enabled} onCheckedChange={checked => setFeatures({ ...features, ai_trial_enabled: checked })} />
                        </div>
                        <div className="p-4 rounded-lg border border-dashed space-y-3">
                          <p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Ativar Trial</p>
                          <div className="flex items-end gap-3">
                            <div className="space-y-1"><Label>Dias</Label><Input type="number" value={trialDays} onChange={e => setTrialDays(Number(e.target.value))} className="w-24" min={1} max={365} /></div>
                            <Button onClick={handleActivateTrial} disabled={saving} variant="outline">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Ativar</Button>
                          </div>
                        </div>
                        <Button onClick={handleSaveFeatures} disabled={saving} className="w-full">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
                      </div>
                    ) : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive" /> Logs da IA
                  <Button variant="ghost" size="sm" onClick={loadErrorLogs} disabled={logsLoading} className="ml-auto">{logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errorLogs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum erro.</p> : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {errorLogs.map(log => (
                      <div key={log.id} className="p-3 rounded-lg border text-sm space-y-1">
                        <div className="flex items-center gap-2 justify-between">
                          <Badge variant="outline" className="text-xs">{log.feature}</Badge>
                          {log.provider_status && <Badge variant="destructive" className="text-xs">HTTP {log.provider_status}</Badge>}
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{log.error_message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deletingChurch}
        onOpenChange={open => !open && setDeletingChurch(null)}
        title={`Excluir ${deletingChurch?.name || "igreja"}?`}
        description={`ATENÇÃO: Esta ação removerá PERMANENTEMENTE a igreja "${deletingChurch?.name}" e TODOS os dados vinculados (membros, células, financeiro, relatórios, etc). Esta ação NÃO pode ser desfeita.`}
        onConfirm={handleDeleteChurch}
      />
    </div>
  );
}
