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
import {
  Loader2, Shield, Church, Bot, Calendar, AlertTriangle,
  Users, Building2, Palette, Power, Edit2, Save, X, Plus, LogOut,
  Smartphone, Image, Megaphone,
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

export default function Master() {
  const { isSuperAdmin, isChecking } = useSuperAdmin();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [churches, setChurches] = useState<ChurchItem[]>([]);
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

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadChurches();
    loadErrorLogs();
  }, [isSuperAdmin]);

  const loadChurches = async () => {
    setLoading(true);
    const { data: churchesData } = await supabase
      .from("churches")
      .select("id, name, slug, plan, is_active, primary_color, secondary_color, ministry_name, logo_url, created_at")
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
        // Create church with admin user via RPC
        const { data, error } = await supabase.rpc("setup_new_church", {
          _church_name: newChurch.name,
          _email: newChurch.email,
          _full_name: newChurch.full_name || newChurch.email,
        });
        if (error) throw error;
        const result = data as any;
        if (result && !result.success) {
          throw new Error(result.error || "Falha ao criar igreja");
        }
        toast({ title: "Igreja criada!", description: `${newChurch.name} criada e admin vinculado.` });
      } else {
        // Create church only (no admin)
        const { error } = await supabase.from("churches").insert({
          name: newChurch.name,
        } as any);
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

  const handleSaveFeatures = async () => {
    if (!selectedChurch || !features) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("church_features").upsert({
        church_id: selectedChurch,
        ai_enabled: features.ai_enabled,
        ai_trial_enabled: features.ai_trial_enabled,
        ai_trial_end: features.ai_trial_end,
      }, { onConflict: "church_id" });
      if (error) throw error;
      toast({ title: "Salvo", description: "Configurações de IA atualizadas." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateTrial = async () => {
    if (!selectedChurch) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("enable_ai_trial", { p_church_id: selectedChurch, p_trial_days: trialDays });
      if (error) throw error;
      toast({ title: "Trial ativado", description: `Trial de ${trialDays} dias ativado.` });
      await loadFeatures(selectedChurch);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleChurchActive = async (churchId: string, currentState: boolean) => {
    const { error } = await supabase
      .from("churches")
      .update({ is_active: !currentState } as any)
      .eq("id", churchId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentState ? "Igreja desativada" : "Igreja ativada" });
      loadChurches();
    }
  };

  const saveChurchBranding = async () => {
    if (!editingChurch) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("churches")
        .update({
          name: editingChurch.name,
          ministry_name: editingChurch.ministry_name,
          primary_color: editingChurch.primary_color,
          secondary_color: editingChurch.secondary_color,
          plan: editingChurch.plan,
          logo_url: editingChurch.logo_url,
        } as any)
        .eq("id", editingChurch.id);
      if (error) throw error;
      toast({ title: "Salvo", description: "Dados da igreja atualizados." });
      setEditingChurch(null);
      loadChurches();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  const totalMembers = churches.reduce((sum, c) => sum + (c.member_count || 0), 0);
  const activeChurches = churches.filter(c => c.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Standalone header for super admin */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Painel Master</h1>
            <p className="text-xs text-muted-foreground">Gestão da Plataforma SaaS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
            <Church className="w-4 h-4 mr-1" /> Ir para Igreja
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{churches.length}</p>
                  <p className="text-sm text-muted-foreground">Igrejas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Power className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">{activeChurches}</p>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                  <p className="text-sm text-muted-foreground">Membros Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{errorLogs.length}</p>
                  <p className="text-sm text-muted-foreground">Erros IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="churches" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="churches">Igrejas</TabsTrigger>
            <TabsTrigger value="ai">Recursos de IA</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Churches Tab */}
          <TabsContent value="churches" className="space-y-4">
            {/* Create Church Form */}
            {showNewChurchForm && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Nova Igreja
                  </CardTitle>
                  <CardDescription>Crie uma nova igreja na plataforma. Opcionalmente vincule um admin pelo email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Igreja *</Label>
                      <Input value={newChurch.name} onChange={e => setNewChurch(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Igreja Nova Aliança" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email do Admin (opcional)</Label>
                      <Input type="email" value={newChurch.email} onChange={e => setNewChurch(p => ({ ...p, email: e.target.value }))} placeholder="admin@igreja.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do Admin (opcional)</Label>
                      <Input value={newChurch.full_name} onChange={e => setNewChurch(p => ({ ...p, full_name: e.target.value }))} placeholder="Nome completo" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se informar o email, o usuário precisa já ter uma conta criada. Ele será vinculado como pastor/admin da igreja.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateChurch} disabled={creating}>
                      {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Plus className="w-4 h-4 mr-2" /> Criar Igreja
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewChurchForm(false)}>
                      <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Church Form */}
            {editingChurch && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="w-5 h-5" />
                    Editar: {editingChurch.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Igreja</Label>
                      <Input value={editingChurch.name} onChange={e => setEditingChurch({ ...editingChurch, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do Ministério (white-label)</Label>
                      <Input value={editingChurch.ministry_name || ""} onChange={e => setEditingChurch({ ...editingChurch, ministry_name: e.target.value })} placeholder="Ex: Ministério Alcançando Vidas" />
                    </div>
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
                    <div className="space-y-2">
                      <Label>URL do Logo</Label>
                      <Input value={editingChurch.logo_url || ""} onChange={e => setEditingChurch({ ...editingChurch, logo_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Plano</Label>
                      <Input value={editingChurch.plan} onChange={e => setEditingChurch({ ...editingChurch, plan: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveChurchBranding} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" /> Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingChurch(null)}>
                      <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Church className="w-5 h-5" />
                    Todas as Igrejas
                  </CardTitle>
                  <CardDescription>{churches.length} igrejas cadastradas</CardDescription>
                </div>
                <Button onClick={() => setShowNewChurchForm(true)} disabled={showNewChurchForm}>
                  <Plus className="w-4 h-4 mr-2" /> Nova Igreja
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Igreja</TableHead>
                          <TableHead>Slug</TableHead>
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
                                {c.logo_url ? (
                                  <img src={c.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                    <Church className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-sm">{c.name}</p>
                                  {c.ministry_name && <p className="text-xs text-muted-foreground">{c.ministry_name}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><code className="text-xs">{c.slug}</code></TableCell>
                            <TableCell><Badge variant="outline">{c.plan}</Badge></TableCell>
                            <TableCell>{c.member_count}</TableCell>
                            <TableCell>
                              <Badge variant={c.is_active ? "default" : "destructive"}>
                                {c.is_active ? "Ativa" : "Inativa"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <div className="w-5 h-5 rounded border" style={{ backgroundColor: c.primary_color || "#1e3a5f" }} />
                                <div className="w-5 h-5 rounded border" style={{ backgroundColor: c.secondary_color || "#d97706" }} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditingChurch(c)} title="Editar">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => toggleChurchActive(c.id, c.is_active)} title={c.is_active ? "Desativar" : "Ativar"}>
                                  <Power className={`w-4 h-4 ${c.is_active ? "text-emerald-500" : "text-destructive"}`} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedChurch(c.id)} title="Configurar IA">
                                  <Bot className="w-4 h-4" />
                                </Button>
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

          {/* AI Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-lg">Selecionar Igreja</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {churches.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChurch(c.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedChurch === c.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"}`}
                      >
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
                  {!selectedChurch ? (
                    <p className="text-muted-foreground text-center py-8">Selecione uma igreja</p>
                  ) : featuresLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  ) : features ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">IA Habilitada (permanente)</p>
                          <p className="text-sm text-muted-foreground">Libera todos os recursos de IA</p>
                        </div>
                        <Switch checked={features.ai_enabled} onCheckedChange={(checked) => setFeatures({ ...features, ai_enabled: checked })} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">Trial Ativo</p>
                          <p className="text-sm text-muted-foreground">
                            {features.ai_trial_enabled && features.ai_trial_end
                              ? `Válido até: ${new Date(features.ai_trial_end).toLocaleDateString("pt-BR")}`
                              : "Sem trial ativo"}
                          </p>
                        </div>
                        <Switch checked={features.ai_trial_enabled} onCheckedChange={(checked) => setFeatures({ ...features, ai_trial_enabled: checked })} />
                      </div>
                      <div className="p-4 rounded-lg border border-dashed space-y-3">
                        <p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Ativar Trial</p>
                        <div className="flex items-end gap-3">
                          <div className="space-y-1">
                            <Label>Dias</Label>
                            <Input type="number" value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} className="w-24" min={1} max={365} />
                          </div>
                          <Button onClick={handleActivateTrial} disabled={saving} variant="outline">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Ativar Trial
                          </Button>
                        </div>
                      </div>
                      <Button onClick={handleSaveFeatures} disabled={saving} className="w-full">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Alterações
                      </Button>
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
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Logs da IA
                  <Button variant="ghost" size="sm" onClick={loadErrorLogs} disabled={logsLoading} className="ml-auto">
                    {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errorLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum erro registrado.</p>
                ) : (
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
    </div>
  );
}
