import { useState } from "react";
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
import { BookOpen, Plus, Loader2, Users, Trash2 } from "lucide-react";
import { useDiscipleships } from "@/hooks/useDiscipleships";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";

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

export default function Discipulados() {
  const [modalOpen, setModalOpen] = useState(false);
  const [disciplerId, setDisciplerId] = useState("");
  const [discipleId, setDiscipleId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("ativo");
  const [notes, setNotes] = useState("");

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { discipleships, isLoading, createDiscipleship, deleteDiscipleship } = useDiscipleships(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  const getMemberName = (id: string | null) => {
    if (!id) return "Não definido";
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
              <Card key={d.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={statusColors[d.status] || ""}>{statusLabels[d.status] || d.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteDiscipleship(d.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getMemberName(d.disciple_id).split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-muted-foreground">Discipulando</p>
                        <p className="font-medium text-sm">{getMemberName(d.disciple_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                          {getMemberName(d.discipler_id).split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-muted-foreground">Discipulador</p>
                        <p className="font-medium text-sm">{getMemberName(d.discipler_id)}</p>
                      </div>
                    </div>
                    {d.start_date && (
                      <p className="text-xs text-muted-foreground">
                        Início: {new Date(d.start_date).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {d.notes && <p className="text-sm text-muted-foreground line-clamp-2">{d.notes}</p>}
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
