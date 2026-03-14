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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Smartphone, QrCode, DollarSign, Save, Loader2, Palette, Image,
  Plus, Edit2, Trash2, Target, Megaphone,
} from "lucide-react";
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
      // Save immediately
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

// ─── Main Page ──────────────────────────────────────────────
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
            <TabsTrigger value="contribuicao"><QrCode className="w-4 h-4 mr-1" /> Contribuição App</TabsTrigger>
            <TabsTrigger value="campanhas"><Target className="w-4 h-4 mr-1" /> Campanhas</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-6">
            <BrandingSection churchId={churchId} />
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
