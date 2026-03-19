import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Plus, Heart, Loader2, Send, Lock, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PrayerRequest {
  id: string;
  member_name: string | null;
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  is_anonymous: boolean;
  is_public: boolean;
  status: string;
  created_at: string;
  user_id: string | null;
}

export function PrayerRequestView({ churchId }: { churchId: string }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [publicRequests, setPublicRequests] = useState<PrayerRequest[]>([]);
  const [myRequests, setMyRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "geral",
    urgency: "normal",
    is_anonymous: false,
    is_public: true,
    contact: "",
  });

  useEffect(() => {
    fetchRequests();
  }, [churchId]);

  const fetchRequests = async () => {
    setLoading(true);
    const [pubRes, myRes] = await Promise.all([
      supabase
        .from("prayer_requests" as any)
        .select("*")
        .eq("church_id", churchId)
        .eq("is_public", true)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(30),
      user
        ? supabase
            .from("prayer_requests" as any)
            .select("*")
            .eq("church_id", churchId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] }),
    ]);
    setPublicRequests((pubRes.data as PrayerRequest[]) || []);
    setMyRequests((myRes.data as PrayerRequest[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("prayer_requests" as any).insert({
        church_id: churchId,
        user_id: user?.id,
        member_name: form.is_anonymous ? null : (profile?.full_name || null),
        contact: form.contact || null,
        title: form.title,
        description: form.description || null,
        category: form.category,
        urgency: form.urgency,
        is_anonymous: form.is_anonymous,
        is_public: form.is_public,
      } as any);
      if (error) throw error;
      toast({ title: "Pedido enviado!", description: form.is_public ? "Seu pedido está no mural." : "Enviado para o ministério de intercessão." });
      setModalOpen(false);
      setForm({ title: "", description: "", category: "geral", urgency: "normal", is_anonymous: false, is_public: true, contact: "" });
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const urgencyColors: Record<string, string> = {
    normal: "bg-muted text-muted-foreground",
    urgente: "bg-amber-100 text-amber-800",
    muito_urgente: "bg-destructive/20 text-destructive",
  };

  const categoryLabels: Record<string, string> = {
    geral: "Geral",
    saude: "Saúde",
    familia: "Família",
    financeiro: "Financeiro",
    espiritual: "Espiritual",
    trabalho: "Trabalho",
    relacionamento: "Relacionamento",
    outro: "Outro",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Pedidos de Oração
        </h3>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Pedido
        </Button>
      </div>

      <Tabs defaultValue="mural">
        <TabsList className="w-full">
          <TabsTrigger value="mural" className="flex-1">
            <Globe className="w-3 h-3 mr-1" /> Mural
          </TabsTrigger>
          <TabsTrigger value="meus" className="flex-1">
            <Lock className="w-3 h-3 mr-1" /> Meus Pedidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mural" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : publicRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido de oração no mural.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {publicRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{req.title}</h4>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">{req.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {!req.is_anonymous && req.member_name && (
                            <span className="text-[10px] text-muted-foreground">{req.member_name}</span>
                          )}
                          {req.is_anonymous && (
                            <span className="text-[10px] text-muted-foreground italic">Anônimo</span>
                          )}
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">
                            {categoryLabels[req.category] || req.category}
                          </Badge>
                          <Badge className={`text-[10px] py-0 h-4 ${urgencyColors[req.urgency] || ""}`}>
                            {req.urgency === "muito_urgente" ? "Muito Urgente" : req.urgency === "urgente" ? "Urgente" : "Normal"}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(req.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meus" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : myRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Você não enviou nenhum pedido ainda.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{req.title}</h4>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">{req.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {req.is_public ? (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 text-emerald-600 border-emerald-200">
                              <Globe className="w-2.5 h-2.5 mr-0.5" /> Público
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 text-amber-600 border-amber-200">
                              <Lock className="w-2.5 h-2.5 mr-0.5" /> Privado
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">
                            {req.status === "ativo" ? "Ativo" : req.status}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {new Date(req.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Prayer Request Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Pedido de Oração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Pedido *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Oração pela minha família"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descreva seu pedido..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="espiritual">Espiritual</SelectItem>
                    <SelectItem value="trabalho">Trabalho</SelectItem>
                    <SelectItem value="relacionamento">Relacionamento</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgência</Label>
                <Select value={form.urgency} onValueChange={(v) => setForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="muito_urgente">Muito Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contato (opcional)</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm(f => ({ ...f, contact: e.target.value }))}
                placeholder="Telefone ou e-mail"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Anônimo?</p>
                <p className="text-xs text-muted-foreground">Seu nome não aparecerá</p>
              </div>
              <Switch checked={form.is_anonymous} onCheckedChange={(v) => setForm(f => ({ ...f, is_anonymous: v }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Publicar no mural?</p>
                <p className="text-xs text-muted-foreground">
                  {form.is_public ? "Visível para todos no mural de oração" : "Apenas para intercessão e admin"}
                </p>
              </div>
              <Switch checked={form.is_public} onCheckedChange={(v) => setForm(f => ({ ...f, is_public: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.title.trim() || sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
