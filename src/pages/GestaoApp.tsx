import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Smartphone, QrCode, DollarSign, Save, Loader2, Palette, Image,
  Plus, Edit2, Trash2, Target, Megaphone, ArrowLeft, Flame, Upload,
  MessageSquare, Globe, Lock, Eye, EyeOff, BookOpen,
} from "lucide-react";
import { RegistrationApproval } from "@/components/admin/RegistrationApproval";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ─── Contribuição App Settings ─────────────────────────────
function ContribuicaoSection({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    pix_key: "", pix_key_type: "", pix_holder_name: "",
    bank_name: "", bank_agency: "", bank_account: "", bank_account_type: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("church_settings" as any)
        .select("pix_key, pix_key_type, pix_holder_name, bank_name, bank_agency, bank_account, bank_account_type")
        .eq("church_id", churchId)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setSettings({
          pix_key: d.pix_key || "", pix_key_type: d.pix_key_type || "",
          pix_holder_name: d.pix_holder_name || "", bank_name: d.bank_name || "",
          bank_agency: d.bank_agency || "", bank_account: d.bank_account || "",
          bank_account_type: d.bank_account_type || "",
        });
      }
      setIsLoading(false);
    })();
  }, [churchId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("church_settings" as any)
        .upsert({ church_id: churchId, ...settings, updated_at: new Date().toISOString() } as any, { onConflict: "church_id" });
      if (error) throw error;
      toast({ title: "Salvo!", description: "Dados de contribuição atualizados no App." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Smartphone className="w-4 h-4 text-primary" />
          <span className="font-medium">Esses dados aparecem no App dos membros</span>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> Pix</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo da Chave</Label>
              <Select value={settings.pix_key_type} onValueChange={v => setSettings(s => ({ ...s, pix_key_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Chave Pix</Label><Input value={settings.pix_key} onChange={e => setSettings(s => ({ ...s, pix_key: e.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Favorecido</Label><Input value={settings.pix_holder_name} onChange={e => setSettings(s => ({ ...s, pix_holder_name: e.target.value }))} /></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Dados Bancários</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Banco</Label><Input value={settings.bank_name} onChange={e => setSettings(s => ({ ...s, bank_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Agência</Label><Input value={settings.bank_agency} onChange={e => setSettings(s => ({ ...s, bank_agency: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Conta</Label><Input value={settings.bank_account} onChange={e => setSettings(s => ({ ...s, bank_account: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={settings.bank_account_type} onValueChange={v => setSettings(s => ({ ...s, bank_account_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Dados de Contribuição
      </Button>
    </div>
  );
}

// ─── Campanhas App ──────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  current_amount: number | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

function CampanhasSection({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", description: "", goal_amount: 0, start_date: "", end_date: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("financial_campaigns")
      .select("id, name, description, goal_amount, current_amount, is_active, start_date, end_date")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [churchId]);

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", goal_amount: 0, start_date: "", end_date: "" }); setModalOpen(true); };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", goal_amount: c.goal_amount || 0, start_date: c.start_date || "", end_date: c.end_date || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        const { error } = await supabase.from("financial_campaigns").update({
          name: form.name, description: form.description || null,
          goal_amount: form.goal_amount || null, start_date: form.start_date || null, end_date: form.end_date || null,
        } as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("financial_campaigns").insert({
          church_id: churchId, name: form.name, description: form.description || null,
          goal_amount: form.goal_amount || null, start_date: form.start_date || null, end_date: form.end_date || null,
        } as any);
        if (error) throw error;
      }
      toast({ title: editing ? "Campanha atualizada!" : "Campanha criada!" });
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (c: Campaign) => {
    await supabase.from("financial_campaigns").update({ is_active: !c.is_active } as any).eq("id", c.id);
    load();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("financial_campaigns").delete().eq("id", id);
    toast({ title: "Campanha removida" });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Megaphone className="w-4 h-4 text-primary" />
          <span className="font-medium">Campanhas ativas aparecem no App dos membros</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Nova Campanha</Button>
      </div>

      {campaigns.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma campanha cadastrada.</CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Arrecadado</TableHead>
              <TableHead>Visível App</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</p>}
                </TableCell>
                <TableCell className="text-right">{c.goal_amount ? `R$ ${Number(c.goal_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</TableCell>
                <TableCell className="text-right">{c.current_amount ? `R$ ${Number(c.current_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00"}</TableCell>
                <TableCell>
                  <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Meta (R$)</Label><Input type="number" min={0} step={0.01} value={form.goal_amount} onChange={e => setForm(f => ({ ...f, goal_amount: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label>Início</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Fim</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Identidade Visual App ──────────────────────────────────
function BrandingSection({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const { refreshChurch } = useAuth();
  const [church, setChurch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("churches").select("id, name, logo_url, primary_color, secondary_color").eq("id", churchId).maybeSingle();
      setChurch(data);
      setLoading(false);
    })();
  }, [churchId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Erro", description: "Imagem deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${churchId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from("church-logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("church-logos").getPublicUrl(path);
      const logoUrl = urlData.publicUrl + "?t=" + Date.now();
      setChurch({ ...church, logo_url: logoUrl });
      await supabase.from("churches").update({ logo_url: logoUrl } as any).eq("id", churchId);
      await refreshChurch();
      toast({ title: "Logo atualizada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar logo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!church) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("churches").update({
        logo_url: church.logo_url, primary_color: church.primary_color, secondary_color: church.secondary_color,
      } as any).eq("id", churchId);
      if (error) throw error;
      await refreshChurch();
      toast({ title: "Visual atualizado!", description: "Logo e cores do App atualizados." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading || !church) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Palette className="w-4 h-4 text-primary" />
          <span className="font-medium">Personalize como o App aparece para os membros</span>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" /> Logo e Cores</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo da Igreja</Label>
            <div className="flex items-center gap-4">
              {church.logo_url ? (
                <img src={church.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded border" />
              ) : (
                <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span>
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                        {uploading ? "Enviando..." : "Enviar Imagem"}
                      </span>
                    </Button>
                  </Label>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                <p className="text-xs text-muted-foreground">ou cole uma URL:</p>
                <Input value={church.logo_url || ""} onChange={e => setChurch({ ...church, logo_url: e.target.value })} placeholder="https://..." className="text-xs" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <Input type="color" value={church.primary_color || "#1e3a5f"} onChange={e => setChurch({ ...church, primary_color: e.target.value })} className="w-14 h-10 p-1" />
                <Input value={church.primary_color || "#1e3a5f"} onChange={e => setChurch({ ...church, primary_color: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex gap-2">
                <Input type="color" value={church.secondary_color || "#d97706"} onChange={e => setChurch({ ...church, secondary_color: e.target.value })} className="w-14 h-10 p-1" />
                <Input value={church.secondary_color || "#d97706"} onChange={e => setChurch({ ...church, secondary_color: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Prévia</p>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: church.primary_color || "#1e3a5f" }}>
              {church.logo_url ? (
                <img src={church.logo_url} alt="" className="w-10 h-10 rounded object-contain bg-white/20" />
              ) : (
                <div className="w-10 h-10 rounded bg-white/20" />
              )}
              <span className="text-white font-bold">{church.name}</span>
            </div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded" style={{ backgroundColor: church.primary_color || "#1e3a5f" }} />
              <div className="h-8 flex-1 rounded" style={{ backgroundColor: church.secondary_color || "#d97706" }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Identidade Visual
      </Button>
    </div>
  );
}

// ─── Módulos do App com Edição em Página ──────────────────────────────────────────
function ModulosSection({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for each module
  const [igrejaForm, setIgrejaForm] = useState({ pastor_name: "", address: "", phone: "", email: "", schedule: "", about: "" });
  const [youtubeForm, setYoutubeForm] = useState({ channel_url: "", description: "" });
  const [redesForm, setRedesForm] = useState({ instagram: "", facebook: "", tiktok: "", twitter: "", website: "" });
  const [devocionalForm, setDevocionalForm] = useState({ title: "", content: "", emoji: "🙏" });
  const [eventosForm, setEventosForm] = useState({ description: "", emoji: "📅" });
  const [muralForm, setMuralForm] = useState({ description: "", emoji: "🙏" });
  const [escalasForm, setEscalasForm] = useState({ description: "", emoji: "⏰" });
  const [cursosForm, setCursosForm] = useState({ description: "", emoji: "🎓" });
  const [celulasForm, setCelulasForm] = useState({ description: "", emoji: "⬛" });
  const [ministeriosForm, setMinisteriosForm] = useState({ description: "", emoji: "🔥" });
  const [doacaoForm, setDoacaoForm] = useState({ description: "", emoji: "🤲" });
  const [perfilForm, setPerfilForm] = useState({ description: "", emoji: "👤" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("app_module_configs" as any)
        .select("module_key, config").eq("church_id", churchId);
      const map: Record<string, any> = {};
      (data || []).forEach((d: any) => { map[d.module_key] = d.config; });
      setConfigs(map);
      // Pre-fill forms
      if (map.igreja) setIgrejaForm({ pastor_name: map.igreja.pastor_name || "", address: map.igreja.address || "", phone: map.igreja.phone || "", email: map.igreja.email || "", schedule: map.igreja.schedule || "", about: map.igreja.about || "" });
      if (map.youtube) setYoutubeForm({ channel_url: map.youtube.channel_url || "", description: map.youtube.description || "" });
      if (map.redes_sociais) setRedesForm({ instagram: map.redes_sociais.instagram || "", facebook: map.redes_sociais.facebook || "", tiktok: map.redes_sociais.tiktok || "", twitter: map.redes_sociais.twitter || "", website: map.redes_sociais.website || "" });
      if (map.devocional) setDevocionalForm({ title: map.devocional.title || "", content: map.devocional.content || "", emoji: map.devocional.emoji || "🙏" });
      if (map.eventos) setEventosForm({ description: map.eventos.description || "", emoji: map.eventos.emoji || "📅" });
      if (map.mural_oracoes) setMuralForm({ description: map.mural_oracoes.description || "", emoji: map.mural_oracoes.emoji || "🙏" });
      if (map.escalas) setEscalasForm({ description: map.escalas.description || "", emoji: map.escalas.emoji || "⏰" });
      if (map.cursos) setCursosForm({ description: map.cursos.description || "", emoji: map.cursos.emoji || "🎓" });
      if (map.celulas) setCelulasForm({ description: map.celulas.description || "", emoji: map.celulas.emoji || "⬛" });
      if (map.ministerios) setMinisteriosForm({ description: map.ministerios.description || "", emoji: map.ministerios.emoji || "🔥" });
      if (map.doacao) setDoacaoForm({ description: map.doacao.description || "", emoji: map.doacao.emoji || "🤲" });
      if (map.perfil) setPerfilForm({ description: map.perfil.description || "", emoji: map.perfil.emoji || "👤" });
      setLoading(false);
    })();
  }, [churchId]);

  const saveModule = async (moduleKey: string, config: any) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("app_module_configs" as any)
        .upsert({ church_id: churchId, module_key: moduleKey, config, updated_at: new Date().toISOString() } as any, { onConflict: "church_id,module_key" });
      if (error) throw error;
      setConfigs(prev => ({ ...prev, [moduleKey]: config }));
      toast({ title: "Salvo!", description: "Configuração do módulo atualizada." });
      setEditingModule(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const modules = [
    { key: "igreja", label: "Igreja", icon: "🏠" },
    { key: "ministerios", label: "Ministérios", icon: "🔥" },
    { key: "devocional", label: "Devocional", icon: "📖" },
    { key: "youtube", label: "YouTube", icon: "▶️" },
    { key: "doacao", label: "Doação", icon: "🤲" },
    { key: "redes_sociais", label: "Redes Sociais", icon: "👥" },
    { key: "eventos", label: "Eventos", icon: "📅" },
    { key: "mural_oracoes", label: "Mural de Orações", icon: "🙏" },
    { key: "cursos", label: "Cursos", icon: "🎓" },
    { key: "escalas", label: "Escalas", icon: "⏰" },
    { key: "celulas", label: "Células", icon: "⬛" },
    { key: "perfil", label: "Meu Perfil", icon: "👤" },
  ];

  const getFormForModule = (key: string) => {
    switch (key) {
      case "igreja": return igrejaForm;
      case "youtube": return youtubeForm;
      case "redes_sociais": return redesForm;
      case "devocional": return devocionalForm;
      case "eventos": return eventosForm;
      case "mural_oracoes": return muralForm;
      case "escalas": return escalasForm;
      case "cursos": return cursosForm;
      case "celulas": return celulasForm;
      case "ministerios": return ministeriosForm;
      case "doacao": return doacaoForm;
      case "perfil": return perfilForm;
      default: return {};
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // If editing a module, show full-page editor
  if (editingModule) {
    const mod = modules.find(m => m.key === editingModule);
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setEditingModule(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar aos Módulos
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-xl">{mod?.icon}</span> Configurar: {mod?.label}
            </CardTitle>
            <CardDescription>Dados que aparecem quando o membro acessa "{mod?.label}" no App</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingModule === "igreja" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome do Pastor</Label><Input value={igrejaForm.pastor_name} onChange={e => setIgrejaForm(f => ({ ...f, pastor_name: e.target.value }))} placeholder="Pr. João Silva" /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={igrejaForm.phone} onChange={e => setIgrejaForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={igrejaForm.email} onChange={e => setIgrejaForm(f => ({ ...f, email: e.target.value }))} placeholder="contato@igreja.com" /></div>
                <div className="space-y-2"><Label>Horários de Culto</Label><Input value={igrejaForm.schedule} onChange={e => setIgrejaForm(f => ({ ...f, schedule: e.target.value }))} placeholder="Dom 9h e 18h / Qua 19h30" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Input value={igrejaForm.address} onChange={e => setIgrejaForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, número, bairro, cidade" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Sobre a Igreja</Label><Textarea value={igrejaForm.about} onChange={e => setIgrejaForm(f => ({ ...f, about: e.target.value }))} placeholder="Breve descrição da igreja... Use emojis à vontade! 🙏⛪" rows={4} /></div>
              </div>
            )}

            {editingModule === "youtube" && (
              <>
                <div className="space-y-2"><Label>URL do Canal</Label><Input value={youtubeForm.channel_url} onChange={e => setYoutubeForm(f => ({ ...f, channel_url: e.target.value }))} placeholder="https://youtube.com/@suaigreja" /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea value={youtubeForm.description} onChange={e => setYoutubeForm(f => ({ ...f, description: e.target.value }))} placeholder="Acesse nossos cultos e pregações 🎬" rows={3} /></div>
              </>
            )}

            {editingModule === "redes_sociais" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>📸 Instagram</Label><Input value={redesForm.instagram} onChange={e => setRedesForm(f => ({ ...f, instagram: e.target.value }))} placeholder="https://instagram.com/suaigreja" /></div>
                <div className="space-y-2"><Label>📘 Facebook</Label><Input value={redesForm.facebook} onChange={e => setRedesForm(f => ({ ...f, facebook: e.target.value }))} placeholder="https://facebook.com/suaigreja" /></div>
                <div className="space-y-2"><Label>🎵 TikTok</Label><Input value={redesForm.tiktok} onChange={e => setRedesForm(f => ({ ...f, tiktok: e.target.value }))} placeholder="https://tiktok.com/@suaigreja" /></div>
                <div className="space-y-2"><Label>🐦 X (Twitter)</Label><Input value={redesForm.twitter} onChange={e => setRedesForm(f => ({ ...f, twitter: e.target.value }))} placeholder="https://x.com/suaigreja" /></div>
                <div className="space-y-2 md:col-span-2"><Label>🌐 Site</Label><Input value={redesForm.website} onChange={e => setRedesForm(f => ({ ...f, website: e.target.value }))} placeholder="https://www.suaigreja.com.br" /></div>
              </div>
            )}

            {/* Generic modules: emoji + description */}
            {!["igreja", "youtube", "redes_sociais"].includes(editingModule) && (
              <>
                <div className="space-y-2">
                  <Label>Emoji / Ícone</Label>
                  <Input
                    value={(getFormForModule(editingModule) as any)?.emoji || ""}
                    onChange={e => {
                      const val = e.target.value;
                      switch (editingModule) {
                        case "devocional": setDevocionalForm(f => ({ ...f, emoji: val })); break;
                        case "eventos": setEventosForm(f => ({ ...f, emoji: val })); break;
                        case "mural_oracoes": setMuralForm(f => ({ ...f, emoji: val })); break;
                        case "escalas": setEscalasForm(f => ({ ...f, emoji: val })); break;
                        case "cursos": setCursosForm(f => ({ ...f, emoji: val })); break;
                        case "celulas": setCelulasForm(f => ({ ...f, emoji: val })); break;
                        case "ministerios": setMinisteriosForm(f => ({ ...f, emoji: val })); break;
                        case "doacao": setDoacaoForm(f => ({ ...f, emoji: val })); break;
                        case "perfil": setPerfilForm(f => ({ ...f, emoji: val })); break;
                      }
                    }}
                    placeholder="Escolha um emoji 🎯"
                    className="text-xl w-20"
                  />
                  <p className="text-xs text-muted-foreground">Cole emojis diretamente no campo (ex: 🙏 ⛪ 🎵 📖 ❤️)</p>
                </div>
                <div className="space-y-2">
                  <Label>Descrição / Conteúdo</Label>
                  <Textarea
                    value={(getFormForModule(editingModule) as any)?.description || (getFormForModule(editingModule) as any)?.content || ""}
                    onChange={e => {
                      const val = e.target.value;
                      switch (editingModule) {
                        case "devocional": setDevocionalForm(f => ({ ...f, content: val })); break;
                        case "eventos": setEventosForm(f => ({ ...f, description: val })); break;
                        case "mural_oracoes": setMuralForm(f => ({ ...f, description: val })); break;
                        case "escalas": setEscalasForm(f => ({ ...f, description: val })); break;
                        case "cursos": setCursosForm(f => ({ ...f, description: val })); break;
                        case "celulas": setCelulasForm(f => ({ ...f, description: val })); break;
                        case "ministerios": setMinisteriosForm(f => ({ ...f, description: val })); break;
                        case "doacao": setDoacaoForm(f => ({ ...f, description: val })); break;
                        case "perfil": setPerfilForm(f => ({ ...f, description: val })); break;
                      }
                    }}
                    placeholder="Descrição que aparece no módulo... Use emojis à vontade! 🙏"
                    rows={4}
                  />
                </div>
                {editingModule === "devocional" && (
                  <div className="space-y-2">
                    <Label>Título do Devocional</Label>
                    <Input value={devocionalForm.title} onChange={e => setDevocionalForm(f => ({ ...f, title: e.target.value }))} placeholder="Devocional do dia 📖" />
                  </div>
                )}
              </>
            )}

            <Button onClick={() => saveModule(editingModule, getFormForModule(editingModule))} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Smartphone className="w-4 h-4 text-primary" />
          <span className="font-medium">Gerencie os módulos visíveis no App dos membros</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos do App</CardTitle>
          <CardDescription>Clique em "Editar" para configurar o conteúdo de cada módulo em uma página dedicada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {modules.map(m => (
              <div key={m.key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{configs[m.key]?.emoji || m.icon}</span>
                  <div>
                    <span className="font-medium text-sm">{m.label}</span>
                    {configs[m.key] && <Badge variant="secondary" className="ml-2 text-[10px]">Configurado</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingModule(m.key)}>
                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Switch checked={true} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// ─── Devocionais Management ──────────────────────────────────
function DevocionaisSection({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [form, setForm] = useState({
    devotional_date: "", title: "", bible_reference: "", content: "", application: "", prayer: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("devotionals" as any)
      .select("*").eq("church_id", churchId)
      .order("devotional_date", { ascending: false }).limit(100);
    setDevotionals((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [churchId]);

  const openNew = () => {
    setEditing(null);
    setForm({ devotional_date: "", title: "", bible_reference: "", content: "", application: "", prayer: "" });
    setModalOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      devotional_date: d.devotional_date || "",
      title: d.title || "",
      bible_reference: d.bible_reference || "",
      content: d.content || "",
      application: d.application || "",
      prayer: d.prayer || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.devotional_date || !form.content.trim()) return;
    try {
      if (editing) {
        const { error } = await supabase.from("devotionals" as any).update({
          ...form, updated_at: new Date().toISOString(),
        } as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("devotionals" as any).insert({
          church_id: churchId, created_by: user?.id, ...form,
        } as any);
        if (error) throw error;
      }
      toast({ title: editing ? "Devocional atualizado!" : "Devocional criado!" });
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("devotionals" as any).delete().eq("id", id);
    toast({ title: "Devocional removido" });
    load();
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setBulkImporting(true);
    try {
      // Parse structured text: each devotional separated by "---"
      // Format: DATE | TITLE | REFERENCE\nCONTENT\n[APLICAÇÃO: ...]\n[ORAÇÃO: ...]
      const blocks = bulkText.split("---").map(b => b.trim()).filter(Boolean);
      const records: any[] = [];
      for (const block of blocks) {
        const lines = block.split("\n");
        const header = lines[0];
        const headerParts = header.split("|").map(p => p.trim());
        if (headerParts.length < 2) continue;
        const date = headerParts[0]; // yyyy-MM-dd
        const title = headerParts[1];
        const reference = headerParts[2] || null;
        
        let content = "";
        let application = "";
        let prayer = "";
        let section = "content";
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.toLowerCase().startsWith("aplicação:") || line.toLowerCase().startsWith("aplicacao:")) {
            section = "application";
            application = line.replace(/^aplicaç[aã]o:/i, "").trim();
          } else if (line.toLowerCase().startsWith("oração:") || line.toLowerCase().startsWith("oracao:")) {
            section = "prayer";
            prayer = line.replace(/^oraç[aã]o:/i, "").trim();
          } else if (section === "content") {
            content += (content ? "\n" : "") + line;
          } else if (section === "application") {
            application += (application ? "\n" : "") + line;
          } else if (section === "prayer") {
            prayer += (prayer ? "\n" : "") + line;
          }
        }
        if (date && title && content) {
          records.push({
            church_id: churchId, created_by: user?.id,
            devotional_date: date, title, bible_reference: reference,
            content: content.trim(), application: application.trim() || null,
            prayer: prayer.trim() || null,
          });
        }
      }
      if (records.length === 0) {
        toast({ title: "Nenhum devocional encontrado", description: "Verifique o formato.", variant: "destructive" });
        setBulkImporting(false);
        return;
      }
      const { error } = await supabase.from("devotionals" as any).insert(records as any);
      if (error) throw error;
      toast({ title: `${records.length} devocionais importados!` });
      setBulkModalOpen(false);
      setBulkText("");
      load();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setBulkImporting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Flame className="w-4 h-4 text-primary" />
          <span className="font-medium">Gerencie os devocionais diários que aparecem no App</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setBulkModalOpen(true)}>
          <Upload className="w-4 h-4 mr-2" /> Importar em Lote
        </Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Devocional</Button>
      </div>

      {devotionals.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum devocional cadastrado.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {devotionals.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{d.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(d.devotional_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  {d.bible_reference && <Badge variant="secondary" className="text-[10px] py-0">{d.bible_reference}</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Devotional Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Devocional" : "Novo Devocional"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.devotional_date} onChange={e => setForm(f => ({ ...f, devotional_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Referência Bíblica</Label><Input value={form.bible_reference} onChange={e => setForm(f => ({ ...f, bible_reference: e.target.value }))} placeholder="João 3:16" /></div>
            </div>
            <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do devocional" /></div>
            <div className="space-y-2"><Label>Conteúdo *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Texto principal do devocional..." /></div>
            <div className="space-y-2"><Label>Aplicação</Label><Textarea value={form.application} onChange={e => setForm(f => ({ ...f, application: e.target.value }))} rows={2} placeholder="Como aplicar na vida..." /></div>
            <div className="space-y-2"><Label>Oração</Label><Textarea value={form.prayer} onChange={e => setForm(f => ({ ...f, prayer: e.target.value }))} rows={2} placeholder="Oração do dia..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || !form.devotional_date || !form.content.trim()}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Devocionais em Lote</DialogTitle>
            <DialogDescription>
              Cole o conteúdo dos devocionais no formato abaixo. Separe cada devocional com "---".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted text-xs font-mono whitespace-pre-line">
{`2026-01-01 | Novo Começo | Isaías 43:19
Texto do devocional aqui...
Aplicação: Como aplicar...
Oração: Senhor, neste novo ano...
---
2026-01-02 | Fé e Esperança | Hebreus 11:1
Texto do segundo devocional...
Aplicação: Reflita sobre...
Oração: Pai, aumenta minha fé...`}
            </div>
            <Textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows={12}
              placeholder="Cole os devocionais aqui seguindo o formato acima..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkImport} disabled={bulkImporting || !bulkText.trim()}>
              {bulkImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Hero Background, Video & Gradient ──────────────────────────────────
function HeroBgSection({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [gradientType, setGradientType] = useState<"none" | "linear" | "radial">("none");
  const [gradColor1, setGradColor1] = useState("#1e3a5f");
  const [gradColor2, setGradColor2] = useState("#d97706");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("app_module_configs" as any)
        .select("config").eq("church_id", churchId).eq("module_key", "hero_bg").maybeSingle();
      const cfg = (data as any)?.config || {};
      setBgUrl(cfg.bg_url || null);
      setVideoUrl(cfg.video_url || "");
      if (cfg.gradient_type) setGradientType(cfg.gradient_type);
      if (cfg.grad_color1) setGradColor1(cfg.grad_color1);
      if (cfg.grad_color2) setGradColor2(cfg.grad_color2);
      setLoading(false);
    })();
  }, [churchId]);

  const saveConfig = async (overrides: Record<string, any> = {}) => {
    setSaving(true);
    try {
      const gt = overrides.gradient_type ?? gradientType;
      const c1 = overrides.grad_color1 ?? gradColor1;
      const c2 = overrides.grad_color2 ?? gradColor2;
      let gradient: string | null = null;
      if (gt === "linear") gradient = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
      if (gt === "radial") gradient = `radial-gradient(circle at center, ${c1} 0%, ${c2} 100%)`;

      await supabase.from("app_module_configs" as any).upsert({
        church_id: churchId, module_key: "hero_bg",
        config: {
          bg_url: overrides.bg_url !== undefined ? overrides.bg_url : bgUrl,
          video_url: overrides.video_url !== undefined ? overrides.video_url : videoUrl,
          gradient, gradient_type: gt, grad_color1: c1, grad_color2: c2,
        },
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "church_id,module_key" });
      toast({ title: "Configuração salva!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "Imagem deve ter no máximo 5MB.", variant: "destructive" }); return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${churchId}/hero.${ext}`;
      const { error: upErr } = await supabase.storage.from("hero-bg").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("hero-bg").getPublicUrl(path);
      const newUrl = urlData.publicUrl + "?t=" + Date.now();
      setBgUrl(newUrl);
      await saveConfig({ bg_url: newUrl });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleRemoveBg = async () => { setBgUrl(null); await saveConfig({ bg_url: null }); };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  let gradientPreview = `linear-gradient(135deg, ${gradColor1} 0%, ${gradColor2} 100%)`;
  if (gradientType === "radial") gradientPreview = `radial-gradient(circle at center, ${gradColor1} 0%, ${gradColor2} 100%)`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" /> Fundo do App (Hero)</CardTitle>
          <CardDescription>Imagem, vídeo ou degradê de fundo do Meu App</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image */}
          <div className="space-y-3">
            <Label className="font-semibold">Imagem de Fundo</Label>
            {bgUrl && (
              <div className="relative rounded-lg overflow-hidden">
                <img src={bgUrl} alt="Hero BG" className="w-full h-32 object-cover rounded-lg" />
                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={handleRemoveBg}>
                  <Trash2 className="w-3 h-3 mr-1" /> Remover
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="hero-bg-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span>{uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Enviar Imagem</>}</span>
                </Button>
              </Label>
              <input id="hero-bg-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              <p className="text-xs text-muted-foreground mt-1">Recomendado: 1080x720px, máx 5MB</p>
            </div>
          </div>

          {/* Video */}
          <div className="space-y-3 pt-3 border-t">
            <Label className="font-semibold">Vídeo de Fundo (opcional)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://exemplo.com/video.mp4" />
              </div>
              <div>
                <Label htmlFor="video-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <span><Upload className="w-4 h-4 mr-1" /> Upload</span>
                  </Button>
                </Label>
                <input id="video-upload" type="file" accept="video/mp4,video/webm" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 50 * 1024 * 1024) {
                    toast({ title: "Erro", description: "Vídeo deve ter no máximo 50MB.", variant: "destructive" }); return;
                  }
                  setUploading(true);
                  try {
                    const ext = file.name.split(".").pop() || "mp4";
                    const path = `${churchId}/hero-video.${ext}`;
                    const { error: upErr } = await supabase.storage.from("video-bg").upload(path, file, { upsert: true });
                    if (upErr) throw upErr;
                    const { data: urlData } = supabase.storage.from("video-bg").getPublicUrl(path);
                    const newUrl = urlData.publicUrl + "?t=" + Date.now();
                    setVideoUrl(newUrl);
                    await saveConfig({ video_url: newUrl });
                    toast({ title: "Vídeo enviado!" });
                  } catch (err: any) {
                    toast({ title: "Erro", description: err.message, variant: "destructive" });
                  } finally { setUploading(false); }
                }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Upload de vídeo MP4 (máx 50MB) ou cole uma URL. Autoplay sem som, responsivo.</p>
          </div>

          {/* Gradient */}
          <div className="space-y-3 pt-3 border-t">
            <Label className="font-semibold">Degradê de Cores</Label>
            <Select value={gradientType} onValueChange={(v: any) => setGradientType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem degradê (cor primária)</SelectItem>
                <SelectItem value="linear">Degradê Linear</SelectItem>
                <SelectItem value="radial">Degradê Radial</SelectItem>
              </SelectContent>
            </Select>
            {gradientType !== "none" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor 1</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={gradColor1} onChange={e => setGradColor1(e.target.value)} className="w-14 h-10 p-1" />
                      <Input value={gradColor1} onChange={e => setGradColor1(e.target.value)} className="text-xs" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor 2</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={gradColor2} onChange={e => setGradColor2(e.target.value)} className="w-14 h-10 p-1" />
                      <Input value={gradColor2} onChange={e => setGradColor2(e.target.value)} className="text-xs" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg h-16 border" style={{ background: gradientPreview }} />
              </>
            )}
          </div>

          <Button onClick={() => saveConfig()} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Configuração de Fundo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Prayer Admin Section ──────────────────────────────────
function PrayerAdminSection({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "publicos" | "privados">("todos");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("prayer_requests" as any)
      .select("*").eq("church_id", churchId)
      .order("created_at", { ascending: false }).limit(100);
    if (filter === "publicos") query = query.eq("is_public", true);
    if (filter === "privados") query = query.eq("is_public", false);
    const { data } = await query;
    setRequests((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [churchId, filter]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativo" ? "respondido" : "ativo";
    await supabase.from("prayer_requests" as any).update({ status: newStatus } as any).eq("id", id);
    toast({ title: newStatus === "respondido" ? "Marcado como respondido" : "Reativado" });
    load();
  };

  const deleteRequest = async (id: string) => {
    await supabase.from("prayer_requests" as any).delete().eq("id", id);
    toast({ title: "Pedido removido" });
    load();
  };

  const urgencyColors: Record<string, string> = {
    normal: "bg-muted text-muted-foreground",
    urgente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    muito_urgente: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-medium">Gerencie os pedidos de oração recebidos dos membros</span>
        </div>
      </div>

      <div className="flex gap-2">
        {(["todos", "publicos", "privados"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "todos" && <Eye className="w-3 h-3 mr-1" />}
            {f === "publicos" && <Globe className="w-3 h-3 mr-1" />}
            {f === "privados" && <Lock className="w-3 h-3 mr-1" />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum pedido de oração.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {requests.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{r.title}</h4>
                      {r.is_public ? (
                        <Badge variant="outline" className="text-[10px] py-0 h-4"><Globe className="w-2.5 h-2.5 mr-0.5" /> Público</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 h-4 text-amber-600 border-amber-200"><Lock className="w-2.5 h-2.5 mr-0.5" /> Privado</Badge>
                      )}
                      <Badge className={`text-[10px] py-0 h-4 ${urgencyColors[r.urgency] || ""}`}>
                        {r.urgency === "muito_urgente" ? "Muito Urgente" : r.urgency === "urgente" ? "Urgente" : "Normal"}
                      </Badge>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{r.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>{r.is_anonymous ? "Anônimo" : (r.member_name || "Sem nome")}</span>
                      {r.contact && <span>📞 {r.contact}</span>}
                      <span>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                      <Badge variant={r.status === "ativo" ? "secondary" : "default"} className="text-[10px] py-0 h-4">
                        {r.status === "ativo" ? "Ativo" : "Respondido"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => toggleStatus(r.id, r.status)} title={r.status === "ativo" ? "Marcar respondido" : "Reativar"}>
                      {r.status === "ativo" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteRequest(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


export default function GestaoApp() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;

  if (!churchId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Igreja não identificada.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-primary" /> Gestão do App
          </h1>
          <p className="text-muted-foreground">Configure o que os membros veem no aplicativo</p>
        </div>

        <Tabs defaultValue="branding">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="branding"><Palette className="w-4 h-4 mr-1" /> Visual</TabsTrigger>
            <TabsTrigger value="modulos"><Smartphone className="w-4 h-4 mr-1" /> Módulos</TabsTrigger>
            <TabsTrigger value="devocionais"><Flame className="w-4 h-4 mr-1" /> Devocionais</TabsTrigger>
            <TabsTrigger value="oracoes"><MessageSquare className="w-4 h-4 mr-1" /> Orações</TabsTrigger>
            <TabsTrigger value="contribuicao"><QrCode className="w-4 h-4 mr-1" /> Contribuição</TabsTrigger>
            <TabsTrigger value="campanhas"><Target className="w-4 h-4 mr-1" /> Campanhas</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-6 space-y-6">
            <BrandingSection churchId={churchId} />
            <HeroBgSection churchId={churchId} />
          </TabsContent>
          <TabsContent value="modulos" className="mt-6">
            <ModulosSection churchId={churchId} />
          </TabsContent>
          <TabsContent value="devocionais" className="mt-6">
            <DevocionaisSection churchId={churchId} />
          </TabsContent>
          <TabsContent value="oracoes" className="mt-6">
            <PrayerAdminSection churchId={churchId} />
          </TabsContent>
          <TabsContent value="contribuicao" className="mt-6">
            <ContribuicaoSection churchId={churchId} />
          </TabsContent>
          <TabsContent value="campanhas" className="mt-6">
            <CampanhasSection churchId={churchId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
