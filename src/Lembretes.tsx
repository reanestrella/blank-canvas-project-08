import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bell, Plus, Loader2, Calendar, Trash2, CheckCircle2 } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";

const typeLabels: Record<string, string> = {
  geral: "Geral",
  visita: "Visita",
  retorno_pastoral: "Retorno Pastoral",
  acompanhamento: "Acompanhamento Espiritual",
  discipulado: "Discipulado",
};

export default function Lembretes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderType, setReminderType] = useState("geral");

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { reminders, isLoading, createReminder, toggleComplete, deleteReminder } = useReminders(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  const getMemberName = (id: string | null) => {
    if (!id) return null;
    return members.find(m => m.id === id)?.full_name || null;
  };

  const pendingReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  const handleSubmit = async () => {
    if (!title) return;
    const result = await createReminder({
      title,
      description: description || undefined,
      member_id: memberId || undefined,
      due_date: dueDate || undefined,
      reminder_type: reminderType,
    });
    if (!result.error) {
      setModalOpen(false);
      setTitle("");
      setDescription("");
      setMemberId("");
      setDueDate("");
    }
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date(new Date().toISOString().split("T")[0]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Lembretes</h1>
            <p className="text-muted-foreground">Gerencie lembretes pastorais e administrativos</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lembrete
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reminders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum lembrete</h3>
            <p className="text-muted-foreground mb-4">Crie lembretes para visitas, acompanhamentos e retornos.</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Lembrete
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingReminders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Pendentes ({pendingReminders.length})</h3>
                {pendingReminders.map(r => (
                  <Card key={r.id} className={`hover:shadow-md transition-all ${isOverdue(r.due_date) ? "border-destructive/50" : ""}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => toggleComplete(r.id, true)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{r.title}</p>
                          <Badge variant="outline">{typeLabels[r.reminder_type] || r.reminder_type}</Badge>
                          {isOverdue(r.due_date) && <Badge variant="destructive">Atrasado</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {r.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(r.due_date).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {r.member_id && <span>Membro: {getMemberName(r.member_id)}</span>}
                        </div>
                        {r.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{r.description}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {completedReminders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-muted-foreground">Concluídos ({completedReminders.length})</h3>
                {completedReminders.slice(0, 5).map(r => (
                  <Card key={r.id} className="opacity-60">
                    <CardContent className="p-4 flex items-center gap-4">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-through">{r.title}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => toggleComplete(r.id, false)}>
                        Desfazer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lembrete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Visitar família Silva" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={reminderType} onValueChange={setReminderType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="retorno_pastoral">Retorno Pastoral</SelectItem>
                    <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                    <SelectItem value="discipulado">Discipulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Membro Relacionado</Label>
              <MemberAutocomplete churchId={churchId || ""} value={memberId} onChange={(id) => setMemberId(id || "")} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes do lembrete..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!title}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
