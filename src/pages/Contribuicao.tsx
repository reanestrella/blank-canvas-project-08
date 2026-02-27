import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DollarSign, QrCode, Save, Loader2, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContribuicaoSettings {
  pix_key: string;
  pix_key_type: string;
  pix_holder_name: string;
  bank_name: string;
  bank_agency: string;
  bank_account: string;
  bank_account_type: string;
}

const emptySettings: ContribuicaoSettings = {
  pix_key: "", pix_key_type: "", pix_holder_name: "",
  bank_name: "", bank_agency: "", bank_account: "", bank_account_type: "",
};

export default function Contribuicao() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const churchId = profile?.church_id;
  const canEdit = isAdmin();

  const [settings, setSettings] = useState<ContribuicaoSettings>(emptySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!churchId) return;
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("church_settings" as any)
        .select("pix_key, pix_key_type, pix_holder_name, bank_name, bank_agency, bank_account, bank_account_type")
        .eq("church_id", churchId)
        .maybeSingle();
      if (data) {
        setSettings({
          pix_key: (data as any).pix_key || "",
          pix_key_type: (data as any).pix_key_type || "",
          pix_holder_name: (data as any).pix_holder_name || "",
          bank_name: (data as any).bank_name || "",
          bank_agency: (data as any).bank_agency || "",
          bank_account: (data as any).bank_account || "",
          bank_account_type: (data as any).bank_account_type || "",
        });
      }
      setIsLoading(false);
    };
    load();
  }, [churchId]);

  const handleSave = async () => {
    if (!churchId) return;
    // Basic validation
    if (!settings.pix_key && !settings.bank_name) {
      toast({ title: "Erro", description: "Preencha ao menos a chave Pix ou os dados bancários.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("church_settings" as any)
        .upsert({
          church_id: churchId,
          ...settings,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "church_id" });
      if (error) throw error;
      toast({ title: "Salvo!", description: "Dados de contribuição atualizados." });
      setEditing(false);
    } catch (err: any) {
      console.error("[Contribuicao] Error saving:", err);
      toast({ title: "Erro", description: err.message || "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const hasData = settings.pix_key || settings.bank_name;
  const showForm = canEdit && (editing || !hasData);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Contribuição</h1>
            <p className="text-muted-foreground">Dados para contribuições e ofertas</p>
          </div>
          {canEdit && hasData && !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />Editar
            </Button>
          )}
        </div>

        {showForm ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> Pix</CardTitle>
                <CardDescription>Configure a chave Pix da igreja</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo da Chave</Label>
                    <Select value={settings.pix_key_type} onValueChange={(v) => setSettings(s => ({ ...s, pix_key_type: v }))}>
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
                  <div className="space-y-2">
                    <Label>Chave Pix</Label>
                    <Input value={settings.pix_key} onChange={(e) => setSettings(s => ({ ...s, pix_key: e.target.value }))} placeholder="Chave Pix" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome do Favorecido</Label>
                    <Input value={settings.pix_holder_name} onChange={(e) => setSettings(s => ({ ...s, pix_holder_name: e.target.value }))} placeholder="Nome completo" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Dados Bancários</CardTitle>
                <CardDescription>Conta bancária para transferências</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input value={settings.bank_name} onChange={(e) => setSettings(s => ({ ...s, bank_name: e.target.value }))} placeholder="Ex: Banco do Brasil" />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input value={settings.bank_agency} onChange={(e) => setSettings(s => ({ ...s, bank_agency: e.target.value }))} placeholder="0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input value={settings.bank_account} onChange={(e) => setSettings(s => ({ ...s, bank_account: e.target.value }))} placeholder="00000-0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Conta</Label>
                    <Select value={settings.bank_account_type} onValueChange={(v) => setSettings(s => ({ ...s, bank_account_type: v }))}>
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

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
              {hasData && (
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.pix_key && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" /> Pix</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {settings.pix_key_type && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tipo:</span><span className="font-medium capitalize">{settings.pix_key_type}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Chave:</span><span className="font-mono font-medium">{settings.pix_key}</span></div>
                  {settings.pix_holder_name && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Favorecido:</span><span className="font-medium">{settings.pix_holder_name}</span></div>}
                </CardContent>
              </Card>
            )}
            {settings.bank_name && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Dados Bancários</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[["Banco", settings.bank_name], ["Agência", settings.bank_agency], ["Conta", settings.bank_account], ["Tipo", settings.bank_account_type], ["Favorecido", settings.pix_holder_name]].filter(([,v]) => v).map(([l,v]) => (
                    <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}:</span><span className="font-medium">{v}</span></div>
                  ))}
                </CardContent>
              </Card>
            )}
            {!hasData && (
              <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">Nenhum dado de contribuição cadastrado.</p></CardContent></Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
