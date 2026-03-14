import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import {
  HeartHandshake, BookOpen, Home, Calendar, FileText, StickyNote,
  Plus, Edit2, Trash2, Loader2, MoreHorizontal, Search, Users,
  Eye, UserCheck, Phone, Mail, Save, X,
} from "lucide-react";
import { AgendaTab } from "@/components/pastoral/AgendaTab";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDiscipleships } from "@/hooks/useDiscipleships";
import { usePastoralVisits } from "@/hooks/usePastoralVisits";
import { usePastoralCounseling } from "@/hooks/usePastoralCounseling";

// ─── Esboços ────────────────────────────────────────────────
function EsbocosTab({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [outlines, setOutlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", theme: "", base_text: "", content: "", sermon_date: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sermon_outlines")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    setOutlines(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [churchId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return outlines;
    const s = search.toLowerCase();
    return outlines.filter(o =>
      o.title?.toLowerCase().includes(s) || o.theme?.toLowerCase().includes(s) || o.base_text?.toLowerCase().includes(s)
    );
  }, [outlines, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", theme: "", base_text: "", content: "", sermon_date: "" });
    setModalOpen(true);
  };

  const openEdit = (o: any) => {
    setEditing(o);
    setForm({ title: o.title || "", theme: o.theme || "", base_text: o.base_text || "", content: o.content || "", sermon_date: o.sermon_date || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      if (editing) {
        const { error } = await supabase.from("sermon_outlines").update({
          title: form.title, theme: form.theme || null, base_text: form.base_text || null,
          content: form.content || null, sermon_date: form.sermon_date || null, updated_at: new Date().toISOString(),
        } as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sermon_outlines").insert({
          church_id: churchId, title: form.title, theme: form.theme || null,
          base_text: form.base_text || null, content: form.content || null,
          sermon_date: form.sermon_date || null, created_by: user?.id,
        } as any);
        if (error) throw error;
      }
      toast({ title: editing ? "Esboço atualizado!" : "Esboço criado!" });
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("sermon_outlines").delete().eq("id", id);
    toast({ title: "Esboço removido" });
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar esboços..." className="pl-9" />
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Esboço</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>{search ? "Nenhum esboço encontrado" : "Nenhum esboço cadastrado"}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(o => (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">{o.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(o)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(o.id)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {o.theme && <Badge variant="outline" className="mb-2">{o.theme}</Badge>}
                {o.base_text && <p className="text-xs text-muted-foreground mb-1">📖 {o.base_text}</p>}
                {o.sermon_date && <p className="text-xs text-muted-foreground">{new Date(o.sermon_date).toLocaleDateString("pt-BR")}</p>}
                {o.content && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{o.content}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar Esboço" : "Novo Esboço"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tema</Label><Input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Texto Base</Label><Input value={form.base_text} onChange={e => setForm(f => ({ ...f, base_text: e.target.value }))} placeholder="Ex: João 3:16" /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.sermon_date} onChange={e => setForm(f => ({ ...f, sermon_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Conteúdo</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} placeholder="Escreva seu esboço aqui..." /></div>
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

// ─── Anotações ──────────────────────────────────────────────
function AnotacoesTab({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "", note_type: "geral", member_id: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pastoral_notes")
      .select("*, member:members(full_name)")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    setNotes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [churchId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const s = search.toLowerCase();
    return notes.filter(n =>
      n.title?.toLowerCase().includes(s) || n.content?.toLowerCase().includes(s) || n.member?.full_name?.toLowerCase().includes(s)
    );
  }, [notes, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", content: "", note_type: "geral", member_id: "" });
    setModalOpen(true);
  };

  const openEdit = (n: any) => {
    setEditing(n);
    setForm({ title: n.title || "", content: n.content || "", note_type: n.note_type || "geral", member_id: n.member_id || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.content.trim()) return;
    try {
      const payload: any = {
        title: form.title || "Sem título",
        content: form.content,
        note_type: form.note_type,
        member_id: form.member_id || null,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from("pastoral_notes").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pastoral_notes").insert({ ...payload, church_id: churchId, created_by: user?.id });
        if (error) throw error;
      }
      toast({ title: editing ? "Nota atualizada!" : "Nota criada!" });
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("pastoral_notes").delete().eq("id", id);
    toast({ title: "Nota removida" });
    load();
  };

  const noteTypeLabels: Record<string, string> = {
    geral: "Geral", acompanhamento: "Acompanhamento", visita: "Visita", aconselhamento: "Aconselhamento",
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar anotações..." className="pl-9" />
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Nova Anotação</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>{search ? "Nenhuma nota encontrada" : "Nenhuma anotação registrada"}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(n => (
            <Card key={n.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{n.title || "Sem título"}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{noteTypeLabels[n.note_type] || n.note_type}</Badge>
                      {n.member?.full_name && <span className="text-xs text-muted-foreground">· {n.member.full_name}</span>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(n)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(n.id)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Anotação" : "Nova Anotação"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.note_type} onValueChange={v => setForm(f => ({ ...f, note_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="aconselhamento">Aconselhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Membro (opcional)</Label>
                <MemberAutocomplete churchId={churchId} value={form.member_id || undefined} onChange={v => setForm(f => ({ ...f, member_id: v || "" }))} placeholder="Vincular a membro..." />
              </div>
            </div>
            <div className="space-y-2"><Label>Conteúdo *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.content.trim()}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Discipulado Tab (wrapper) ──────────────────────────────
function DiscipuladoTab({ churchId }: { churchId: string }) {
  const { discipleships, isLoading, createDiscipleship, updateDiscipleship, deleteDiscipleship } = useDiscipleships(churchId);
  const [showForm, setShowForm] = useState(false);
  const [discipleId, setDiscipleId] = useState<string | null>(null);
  const [disciplerId, setDisciplerId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!discipleId) return;
    await createDiscipleship({ disciple_id: discipleId, discipler_id: disciplerId || undefined });
    setDiscipleId(null);
    setDisciplerId(null);
    setShowForm(false);
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    ativo: { label: "Ativo", color: "bg-success/20 text-success" },
    concluido: { label: "Concluído", color: "bg-primary/20 text-primary" },
    pausado: { label: "Pausado", color: "bg-secondary/20 text-secondary" },
    cancelado: { label: "Cancelado", color: "bg-destructive/20 text-destructive" },
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Novo Discipulado</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Novo Discipulado</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Discípulo *</Label>
                <MemberAutocomplete churchId={churchId} value={discipleId || undefined} onChange={setDiscipleId} placeholder="Quem será discipulado..." />
              </div>
              <div className="space-y-2">
                <Label>Discipulador</Label>
                <MemberAutocomplete churchId={churchId} value={disciplerId || undefined} onChange={setDisciplerId} placeholder="Quem discipulará..." />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleCreate} disabled={!discipleId}><Plus className="w-4 h-4 mr-2" /> Iniciar</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {discipleships.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Nenhum discipulado registrado</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discípulo</TableHead>
                  <TableHead>Discipulador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discipleships.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.disciple?.full_name || "—"}</TableCell>
                    <TableCell>{d.discipler?.full_name || "—"}</TableCell>
                    <TableCell>
                      <Select value={d.status} onValueChange={v => updateDiscipleship(d.id, { status: v })}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue><Badge className={statusLabels[d.status]?.color || ""}>{statusLabels[d.status]?.label || d.status}</Badge></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.start_date ? new Date(d.start_date).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteDiscipleship(d.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Visitas Tab (wrapper) ──────────────────────────────────
function VisitasTab({ churchId }: { churchId: string }) {
  const { visits, isLoading, createVisit, deleteVisit } = usePastoralVisits(churchId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ member_id: "", visit_date: new Date().toISOString().split("T")[0], reason: "", notes: "" });

  const handleCreate = async () => {
    if (!form.member_id) return;
    await createVisit({
      member_id: form.member_id,
      visit_date: form.visit_date,
      reason: form.reason || undefined,
      notes: form.notes || undefined,
    });
    setForm({ member_id: "", visit_date: new Date().toISOString().split("T")[0], reason: "", notes: "" });
    setShowForm(false);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Nova Visita</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Registrar Visita</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Membro *</Label>
                <MemberAutocomplete churchId={churchId} value={form.member_id || undefined} onChange={v => setForm(f => ({ ...f, member_id: v || "" }))} />
              </div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Motivo</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Observações</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!form.member_id}><Plus className="w-4 h-4 mr-2" /> Registrar</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {visits.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Nenhuma visita registrada</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="hidden md:table-cell">Observações</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.member?.full_name || "—"}</TableCell>
                    <TableCell>{v.visit_date ? new Date(v.visit_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>{v.reason || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{v.notes || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteVisit(v.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Gabinete / Aconselhamento Tab ──────────────────────────
function GabineteTab({ churchId }: { churchId: string }) {
  const { sessions, isLoading, createSession, deleteSession } = usePastoralCounseling(churchId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ member_id: "", session_date: new Date().toISOString().split("T")[0], session_type: "aconselhamento", notes: "" });

  const handleCreate = async () => {
    await createSession({
      member_id: form.member_id || undefined,
      session_date: form.session_date,
      session_type: form.session_type,
      notes: form.notes || undefined,
    });
    setForm({ member_id: "", session_date: new Date().toISOString().split("T")[0], session_type: "aconselhamento", notes: "" });
    setShowForm(false);
  };

  const typeLabels: Record<string, string> = {
    aconselhamento: "Aconselhamento", oração: "Oração", emergencial: "Emergencial", familiar: "Familiar",
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Novo Atendimento</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Novo Atendimento</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Membro</Label>
                <MemberAutocomplete churchId={churchId} value={form.member_id || undefined} onChange={v => setForm(f => ({ ...f, member_id: v || "" }))} />
              </div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.session_type} onValueChange={v => setForm(f => ({ ...f, session_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aconselhamento">Aconselhamento</SelectItem>
                    <SelectItem value="oração">Oração</SelectItem>
                    <SelectItem value="emergencial">Emergencial</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Registrar</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <HeartHandshake className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Nenhum atendimento registrado</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="hidden md:table-cell">Observações</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.member?.full_name || "Não informado"}</TableCell>
                    <TableCell><Badge variant="outline">{typeLabels[s.session_type] || s.session_type}</Badge></TableCell>
                    <TableCell>{s.session_date ? new Date(s.session_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{s.notes || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteSession(s.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function GestaoPastoral() {
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
            <HeartHandshake className="w-7 h-7 text-primary" /> Gestão Pastoral
          </h1>
          <p className="text-muted-foreground">Ferramentas para o pastoreio e cuidado da igreja</p>
        </div>

        <Tabs defaultValue="discipulado">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="discipulado"><BookOpen className="w-4 h-4 mr-1" /> Discipulado</TabsTrigger>
            <TabsTrigger value="visitas"><Home className="w-4 h-4 mr-1" /> Visitas</TabsTrigger>
            <TabsTrigger value="gabinete"><HeartHandshake className="w-4 h-4 mr-1" /> Gabinete</TabsTrigger>
            <TabsTrigger value="agenda"><Calendar className="w-4 h-4 mr-1" /> Agenda</TabsTrigger>
            <TabsTrigger value="esbocos"><FileText className="w-4 h-4 mr-1" /> Esboços</TabsTrigger>
            <TabsTrigger value="anotacoes"><StickyNote className="w-4 h-4 mr-1" /> Anotações</TabsTrigger>
          </TabsList>

          <TabsContent value="discipulado" className="mt-6">
            <DiscipuladoTab churchId={churchId} />
          </TabsContent>
          <TabsContent value="visitas" className="mt-6">
            <VisitasTab churchId={churchId} />
          </TabsContent>
          <TabsContent value="gabinete" className="mt-6">
            <GabineteTab churchId={churchId} />
          </TabsContent>
          <TabsContent value="agenda" className="mt-6">
            <AgendaTab churchId={churchId} />
          </TabsContent>
          <TabsContent value="esbocos" className="mt-6">
            <EsbocosTab churchId={churchId} />
          </TabsContent>
          <TabsContent value="anotacoes" className="mt-6">
            <AnotacoesTab churchId={churchId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
