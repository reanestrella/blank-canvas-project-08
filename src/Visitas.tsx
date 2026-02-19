import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Home, Plus, Loader2, Calendar, User, Trash2 } from "lucide-react";
import { usePastoralVisits } from "@/hooks/usePastoralVisits";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";

export default function Visitas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { visits, isLoading, createVisit, deleteVisit } = usePastoralVisits(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  const getMemberName = (id: string | null) => {
    if (!id) return "Não definido";
    return members.find(m => m.id === id)?.full_name || "Desconhecido";
  };

  const handleSubmit = async () => {
    const result = await createVisit({
      member_id: memberId || undefined,
      visitor_id: visitorId || undefined,
      visit_date: visitDate,
      reason: reason || undefined,
      notes: notes || undefined,
    });
    if (!result.error) {
      setModalOpen(false);
      setMemberId("");
      setVisitorId("");
      setReason("");
      setNotes("");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Visitas Pastorais</h1>
            <p className="text-muted-foreground">Registre e acompanhe visitas pastorais</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Visita
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : visits.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Home className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma visita registrada</h3>
            <p className="text-muted-foreground mb-4">Registre a primeira visita pastoral.</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Visita
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {visits.map(v => (
              <Card key={v.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{getMemberName(v.member_id)}</p>
                      {v.reason && <Badge variant="outline">{v.reason}</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(v.visit_date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Visitante: {getMemberName(v.visitor_id)}
                      </span>
                    </div>
                    {v.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{v.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteVisit(v.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Visita Pastoral</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Membro Visitado</Label>
              <MemberAutocomplete churchId={churchId || ""} value={memberId} onChange={(id) => setMemberId(id || "")} placeholder="Selecione o membro" />
            </div>
            <div className="space-y-2">
              <Label>Responsável pela Visita</Label>
              <MemberAutocomplete churchId={churchId || ""} value={visitorId} onChange={(id) => setVisitorId(id || "")} placeholder="Quem realizou a visita" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Visita</Label>
                <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Enfermidade, acolhimento..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes da visita..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
