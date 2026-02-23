import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Church, Bot, Calendar } from "lucide-react";

interface ChurchItem {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

interface ChurchFeatures {
  ai_enabled: boolean;
  ai_trial_enabled: boolean;
  ai_trial_end: string | null;
}

export default function DevAdmin() {
  const { isSuperAdmin, isChecking } = useSuperAdmin();
  const { user } = useAuth();
  const { toast } = useToast();

  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChurch, setSelectedChurch] = useState<string | null>(null);
  const [features, setFeatures] = useState<ChurchFeatures | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trialDays, setTrialDays] = useState(30);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const load = async () => {
      const { data } = await supabase.from("churches").select("id, name, plan, created_at").order("name");
      setChurches(data || []);
      setLoading(false);
    };
    load();
  }, [isSuperAdmin]);

  const loadFeatures = async (churchId: string) => {
    setFeaturesLoading(true);
    let { data } = await supabase
      .from("church_features")
      .select("ai_enabled, ai_trial_enabled, ai_trial_end")
      .eq("church_id", churchId)
      .maybeSingle();
    if (!data) {
      await supabase.from("church_features").insert({
        church_id: churchId, ai_enabled: false, ai_trial_enabled: false, ai_trial_start: null, ai_trial_end: null,
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

  const handleSave = async () => {
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
      await loadFeatures(selectedChurch);
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
      const end = new Date();
      end.setDate(end.getDate() + trialDays);
      setFeatures(prev => prev ? { ...prev, ai_trial_enabled: true, ai_trial_end: end.toISOString() } : prev);
      toast({ title: "Trial ativado", description: `Trial de ${trialDays} dias ativado.` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Painel Super Admin</h1>
            <p className="text-muted-foreground">Gerenciamento de recursos por igreja</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Church List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Church className="w-5 h-5" />
                Igrejas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {churches.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChurch(c.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedChurch === c.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"}`}
                    >
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">Plano: {c.plan}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5" />
                Recursos de IA
              </CardTitle>
              <CardDescription>
                {selectedChurch ? churches.find(c => c.id === selectedChurch)?.name : "Selecione uma igreja"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedChurch ? (
                <p className="text-muted-foreground text-center py-8">Selecione uma igreja para gerenciar</p>
              ) : featuresLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : features ? (
                <div className="space-y-6">
                  {/* AI Enabled Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">IA Habilitada (permanente)</p>
                      <p className="text-sm text-muted-foreground">Libera todos os recursos de IA para esta igreja</p>
                    </div>
                    <Switch
                      checked={features.ai_enabled}
                      onCheckedChange={(checked) => setFeatures({ ...features, ai_enabled: checked })}
                    />
                  </div>

                  {/* Trial Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Trial Ativo</p>
                      <p className="text-sm text-muted-foreground">
                        {features.ai_trial_enabled && features.ai_trial_end
                          ? `Válido até: ${new Date(features.ai_trial_end).toLocaleDateString("pt-BR")}`
                          : "Sem trial ativo"}
                      </p>
                    </div>
                    <Switch
                      checked={features.ai_trial_enabled}
                      onCheckedChange={(checked) => setFeatures({ ...features, ai_trial_enabled: checked })}
                    />
                  </div>

                  {/* Activate Trial */}
                  <div className="p-4 rounded-lg border border-dashed space-y-3">
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ativar Trial
                    </p>
                    <div className="flex items-end gap-3">
                      <div className="space-y-1">
                        <Label>Dias</Label>
                        <Input
                          type="number"
                          value={trialDays}
                          onChange={(e) => setTrialDays(Number(e.target.value))}
                          className="w-24"
                          min={1}
                          max={365}
                        />
                      </div>
                      <Button onClick={handleActivateTrial} disabled={saving} variant="outline">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Ativar Trial
                      </Button>
                    </div>
                  </div>

                  {/* Save */}
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
