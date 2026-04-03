import { useState, useEffect } from "react";
import type { Discipleship } from "@/hooks/useDiscipleships";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BookOpen, Plus, Loader2, Users, Trash2, ArrowLeft, Calendar, Send } from "lucide-react";
import { useDiscipleships } from "@/hooks/useDiscipleships";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { supabase } from "@/integrations/supabase/client";

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  pausado: "Pausado",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  ativo: "bg-success/20 text-success",
  concluido: "bg-info/20 text-info",
  pausado: "bg-secondary/20 text-secondary",
  cancelado: "bg-destructive/20 text-destructive",
};

interface DiscipleshipLog {
  id: string;
  log_date: string;
  description: string;
  created_at: string;
}

export default function Discipulados() {
  const [modalOpen, setModalOpen] = useState(false);
  const [disciplerId, setDisciplerId] = useState("");
  const [discipleId, setDiscipleId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("ativo");
  const [notes, setNotes] = useState("");

  // Detail view state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<DiscipleshipLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logForm, setLogForm] = useState({ log_date: new Date().toISOString().split("T")[0], description: "" });

  const { profile, user } = useAuth();
  const { toast } = useToast();
  const churchId = profile?.church_id;
  const { discipleships, isLoading, createDiscipleship, deleteDiscipleship } = useDiscipleships(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  const getMemberName = (id: string | null, disc?: Discipleship | null) => {
    if (!id) return "Não definido";
    // Try joined data first
    if (disc) {
      if (id === disc.disciple_id && disc.disciple?.full_name) return disc.disciple.full_name;
      if (id === disc.discipler_id && disc.discipler?.full_name) return disc.discipler.full_name;
    }
    return members.find(m => m.id === id)?.full_name || "Desconhecido";
  };

  const handleSubmit = async () => {
    if (!discipleId) return;
    const result = await createDiscipleship({
      disciple_id: discipleId,
      discipler_id: disciplerId || undefined,
      start_date: startDate,
      status,
      notes: notes || undefined,
    });
    if (!result.error) {
      setModalOpen(false);
      setDisciplerId("");
      setDiscipleId("");
      setNotes("");
    }
  };

  // Load logs for selected discipleship
  const loadLogs = async (discId: string) => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("discipleship_logs" as any)
      .select("id, log_date, description, created_at")
      .eq("discipleship_id", discId)
      .order("log_date", { ascending: false });
    setLogs((data as DiscipleshipLog[]) || []);
    setLogsLoading(false);
  };

  const handleOpenDetail = (id: string) => {
    setSelectedId(id);
    loadLogs(id);
  };

  const handleAddLog = async () => {
    if (!selectedId || !logForm.description.trim() || !churchId) return;
    const { error } = await supabase.from("discipleship_logs" as any).insert({
      discipleship_id: selectedId,
      church_id: churchId,
      log_date: logForm.log_date,
      description: logForm.description,
      created_by: user?.id,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registro adicionado!" });
      setLogForm({ log_date: new Date().toISOString().split("T")[0], description: "" });
      loadLogs(selectedId);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    await supabase.from("discipleship_logs" as any).delete().eq("id", logId);
    if (selectedId) loadLogs(selectedId);
  };

  // Detail view
  if (selectedId) {
    const disc = discipleships.find(d => d.id === selectedId);
    if (!disc) { setSelectedId(null); return null; }
    return (
      <AppLayout>
        <div className="space-y-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Discipulado</h2>
                  <Badge className={statusColors[disc.status] || ""}>{statusLabels[disc.status] || disc.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Discipulando:</span> <strong>{getMemberName(disc.disciple_id, disc)}</strong></div>
                <div><span className="text-muted-foreground">Discipulador:</span> <strong>{getMemberName(disc.discipler_id, disc)}</strong></div>
                {disc.start_date && <div><span className="text-muted-foreground">Início:</span> {new Date(disc.start_date).toLocaleDateString("pt-BR")}</div>}
                {disc.notes && <div className="col-span-2"><span className="text-muted-foreground">Notas:</span> {disc.notes}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Add log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registrar Acompanhamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input type="date" value={logForm.log_date} onChange={e => setLogForm(f => ({ ...f, log_date: e.target.value }))} className="w-auto" />
                <Input
                  value={logForm.description}
                  onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Nos reunimos e estudamos João 3..."
                  className="flex-1"
                />
                <Button onClick={handleAddLog} disabled={!logForm.description.trim()}>
                  <Send className="w-4 h-4 mr-1" /> Registrar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Histórico de Acompanhamento</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Nenhum registro ainda. Adicione o primeiro acima.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                        <div className="w-0.5 flex-1 bg-border" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-primary">{new Date(log.log_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteLog(log.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                        <p className="text-sm mt-0.5">{log.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Discipulados</h1>
            <p className="text-muted-foreground">Gerencie os processos de discipulado</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Discipulado
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : discipleships.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum discipulado registrado</h3>
            <p className="text-muted-foreground mb-4">Comece cadastrando o primeiro discipulado.</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Discipulado
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discipleships.map(d => (
              <Card key={d.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleOpenDetail(d.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={statusColors[d.status] || ""}>{statusLabels[d.status] || d.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteDiscipleship(d.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getMemberName(d.disciple_id, d).split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-muted-foreground">Discipulando</p>
                        <p className="font-medium text-sm">{getMemberName(d.disciple_id, d)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                          {getMemberName(d.discipler_id, d).split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-muted-foreground">Discipulador</p>
                        <p className="font-medium text-sm">{getMemberName(d.discipler_id, d)}</p>
                      </div>
                    </div>
                    {d.start_date && (
                      <p className="text-xs text-muted-foreground">
                        Início: {new Date(d.start_date).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {d.notes && <p className="text-sm text-muted-foreground line-clamp-2">{d.notes}</p>}
                    <p className="text-xs text-primary font-medium">Clique para ver histórico →</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Discipulado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Discipulando *</Label>
              <MemberAutocomplete
                churchId={churchId || ""}
                value={discipleId}
                onChange={(id) => setDiscipleId(id || "")}
                placeholder="Selecione o discipulando"
              />
            </div>
            <div className="space-y-2">
              <Label>Discipulador</Label>
              <MemberAutocomplete
                churchId={churchId || ""}
                value={disciplerId}
                onChange={(id) => setDisciplerId(id || "")}
                placeholder="Selecione o discipulador"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações sobre o discipulado..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!discipleId}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
