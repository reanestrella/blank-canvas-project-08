import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus, Loader2, MoreHorizontal, Search, Calendar as CalendarIcon, Clock, Filter, List, CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ptBR } from "date-fns/locale";
import { isSameDay } from "date-fns";



interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  appointment_time: string | null;
  end_time: string | null;
  appointment_type: string;
  status: string;
  responsible_id: string | null;
  member_id: string | null;
  notes: string | null;
  created_at: string;
  responsible?: { full_name: string } | null;
  member?: { full_name: string } | null;
}

const typeLabels: Record<string, string> = {
  reuniao: "Reunião",
  visita: "Visita",
  aconselhamento: "Aconselhamento",
  atendimento: "Atendimento",
  evento_interno: "Evento Interno",
  outro: "Outro",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  agendado: { label: "Agendado", color: "bg-info/20 text-info" },
  confirmado: { label: "Confirmado", color: "bg-success/20 text-success" },
  realizado: { label: "Realizado", color: "bg-primary/20 text-primary" },
  cancelado: { label: "Cancelado", color: "bg-destructive/20 text-destructive" },
};

const emptyForm = {
  title: "", description: "", appointment_date: new Date().toISOString().split("T")[0],
  appointment_time: "", end_time: "", appointment_type: "reuniao", status: "agendado",
  responsible_id: "", member_id: "", notes: "",
};

export function AgendaTab({ churchId }: { churchId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "week" | "month">("month");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pastoral_appointments")
      .select("*, responsible:members!pastoral_appointments_responsible_id_fkey(full_name), member:members!pastoral_appointments_member_id_fkey(full_name)")
      .eq("church_id", churchId)
      .order("appointment_date", { ascending: true });
    setAppointments((data as Appointment[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [churchId]);

  const filtered = useMemo(() => {
    let list = appointments;
    
    // If calendar mode with selected date, filter to that day
    if (viewMode === "calendar" && selectedDate) {
      list = list.filter(a => isSameDay(new Date(a.appointment_date + "T12:00:00"), selectedDate));
    } else {
      // Period filter
      const now = new Date();
      if (filterPeriod === "week") {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        list = list.filter(a => {
          const d = new Date(a.appointment_date);
          return d >= new Date(now.toISOString().split("T")[0]) && d <= weekEnd;
        });
      } else if (filterPeriod === "month") {
        list = list.filter(a => {
          const d = new Date(a.appointment_date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
      }
    }

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(s) ||
        a.responsible?.full_name?.toLowerCase().includes(s) ||
        a.member?.full_name?.toLowerCase().includes(s)
      );
    }

    return list;
  }, [appointments, search, filterPeriod, viewMode, selectedDate]);

  const appointmentDates = useMemo(() => {
    return appointments.map(a => new Date(a.appointment_date + "T12:00:00"));
  }, [appointments]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({
      title: a.title, description: a.description || "", appointment_date: a.appointment_date,
      appointment_time: a.appointment_time || "", end_time: a.end_time || "",
      appointment_type: a.appointment_type, status: a.status,
      responsible_id: a.responsible_id || "", member_id: a.member_id || "", notes: a.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      const payload: any = {
        title: form.title, description: form.description || null,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time || null,
        end_time: form.end_time || null,
        appointment_type: form.appointment_type, status: form.status,
        responsible_id: form.responsible_id || null,
        member_id: form.member_id || null, notes: form.notes || null,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from("pastoral_appointments").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pastoral_appointments").insert({
          ...payload, church_id: churchId, created_by: user?.id,
        });
        if (error) throw error;
      }
      toast({ title: editing ? "Compromisso atualizado!" : "Compromisso criado!" });
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("pastoral_appointments").delete().eq("id", id);
    toast({ title: "Compromisso removido" });
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("pastoral_appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar compromissos..." className="pl-9" />
          </div>
          <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Compromisso</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>{search ? "Nenhum compromisso encontrado" : "Nenhum compromisso neste período"}</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Compromisso</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium">{new Date(a.appointment_date + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                      {a.appointment_time && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{a.appointment_time}{a.end_time && ` - ${a.end_time}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{a.title}</div>
                      {a.member?.full_name && <div className="text-xs text-muted-foreground">{a.member.full_name}</div>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{typeLabels[a.appointment_type] || a.appointment_type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {a.responsible?.full_name || "—"}
                    </TableCell>
                    <TableCell>
                      <Select value={a.status} onValueChange={v => handleStatusChange(a.id, v)}>
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue>
                            <Badge className={statusLabels[a.status]?.color || ""}>
                              {statusLabels[a.status]?.label || a.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(a)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(a.id)}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar Compromisso" : "Novo Compromisso"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.appointment_date} onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2"><Label>Hora Início</Label><Input type="time" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Hora Fim</Label><Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.appointment_type} onValueChange={v => setForm(f => ({ ...f, appointment_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <MemberAutocomplete churchId={churchId} value={form.responsible_id || undefined} onChange={v => setForm(f => ({ ...f, responsible_id: v || "" }))} placeholder="Quem é responsável..." />
              </div>
              <div className="space-y-2">
                <Label>Membro relacionado</Label>
                <MemberAutocomplete churchId={churchId} value={form.member_id || undefined} onChange={v => setForm(f => ({ ...f, member_id: v || "" }))} placeholder="Membro (opcional)..." />
              </div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
