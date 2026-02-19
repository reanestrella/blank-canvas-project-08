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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Armchair, Plus, Loader2, Calendar, Shield, Trash2 } from "lucide-react";
import { usePastoralCounseling } from "@/hooks/usePastoralCounseling";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";

const typeLabels: Record<string, string> = {
  aconselhamento: "Aconselhamento",
  oracao: "Oração",
  orientacao: "Orientação",
  crise: "Atendimento de Crise",
  outro: "Outro",
};

export default function Gabinete() {
  const [modalOpen, setModalOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [counselorId, setCounselorId] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState("aconselhamento");
  const [notes, setNotes] = useState("");

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { sessions, isLoading, createSession, deleteSession } = usePastoralCounseling(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  const getMemberName = (id: string | null) => {
    if (!id) return "Não definido";
    return members.find(m => m.id === id)?.full_name || "Desconhecido";
  };

  const handleSubmit = async () => {
    const result = await createSession({
      member_id: memberId || undefined,
      counselor_id: counselorId || undefined,
      session_date: sessionDate,
      session_type: sessionType,
      notes: notes || undefined,
    });
    if (!result.error) {
      setModalOpen(false);
      setMemberId("");
      setCounselorId("");
      setNotes("");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gabinete Pastoral</h1>
            <p className="text-muted-foreground">Registre atendimentos e aconselhamentos pastorais</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Atendimento
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Armchair className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum atendimento registrado</h3>
            <p className="text-muted-foreground mb-4">Registre o primeiro atendimento pastoral.</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Atendimento
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <Card key={s.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <Shield className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{getMemberName(s.member_id)}</p>
                      <Badge variant="outline">{typeLabels[s.session_type] || s.session_type}</Badge>
                      {s.is_private && <Badge variant="secondary" className="text-xs">Privado</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.session_date).toLocaleDateString("pt-BR")}
                      </span>
                      <span>Conselheiro: {getMemberName(s.counselor_id)}</span>
                    </div>
                    {s.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{s.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteSession(s.id)}>
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
            <DialogTitle>Novo Atendimento Pastoral</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Membro Atendido</Label>
              <MemberAutocomplete churchId={churchId || ""} value={memberId} onChange={(id) => setMemberId(id || "")} placeholder="Selecione o membro" />
            </div>
            <div className="space-y-2">
              <Label>Conselheiro / Pastor</Label>
              <MemberAutocomplete churchId={churchId || ""} value={counselorId} onChange={(id) => setCounselorId(id || "")} placeholder="Quem realizou o atendimento" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aconselhamento">Aconselhamento</SelectItem>
                    <SelectItem value="oracao">Oração</SelectItem>
                    <SelectItem value="orientacao">Orientação</SelectItem>
                    <SelectItem value="crise">Atendimento de Crise</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações (Privado)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas confidenciais do atendimento..." />
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
