import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, UserPlus, Users, Link2, ArrowRight, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PendingUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  church_id: string;
  tipo: string;
  status: string;
  created_at: string;
  linked_member_id: string | null;
  congregation_id: string | null;
}

interface ExistingMember {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  spiritual_status: string | null;
  network: string | null;
}

export function PendingUsersTab({ churchId }: { churchId: string }) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [linkingUser, setLinkingUser] = useState<PendingUser | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [existingMember, setExistingMember] = useState<ExistingMember | null>(null);
  const [mergeFields, setMergeFields] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pending_users" as any)
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    setUsers((data as PendingUser[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, [churchId]);

  // When a member is selected for linking, fetch their data for comparison
  useEffect(() => {
    if (!selectedMemberId) {
      setExistingMember(null);
      setMergeFields({});
      return;
    }
    const fetchMember = async () => {
      const { data } = await supabase
        .from("members")
        .select("id, full_name, email, phone, birth_date, spiritual_status, network")
        .eq("id", selectedMemberId)
        .single();
      if (data) {
        setExistingMember(data as ExistingMember);
        // Auto-select fields where pending has data but existing doesn't
        const fields: Record<string, boolean> = {};
        if (linkingUser?.phone && !data.phone) fields.phone = true;
        if (linkingUser?.email && !data.email) fields.email = true;
        if (linkingUser?.birth_date && !data.birth_date) fields.birth_date = true;
        setMergeFields(fields);
      }
    };
    fetchMember();
  }, [selectedMemberId]);

  const handleApprove = async (pu: PendingUser) => {
    setProcessing(pu.id);
    try {
      const { data: newMember, error: memberErr } = await supabase.from("members").insert({
        church_id: churchId,
        full_name: pu.full_name,
        email: pu.email,
        phone: pu.phone,
        birth_date: pu.birth_date,
        spiritual_status: pu.tipo === "visitante" ? "visitante" : "membro",
        congregation_id: pu.congregation_id || null,
        is_active: true,
      }).select().single();

      if (memberErr) throw memberErr;

      await supabase.from("pending_users" as any)
        .update({ status: "aprovado", linked_member_id: newMember.id } as any)
        .eq("id", pu.id);

      toast({ title: "Cadastro aprovado!", description: `${pu.full_name} adicionado como ${pu.tipo}.` });
      fetchPending();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleLinkToExisting = async () => {
    if (!linkingUser || !selectedMemberId) return;
    setProcessing(linkingUser.id);
    try {
      await supabase.from("pending_users" as any)
        .update({ status: "aprovado", linked_member_id: selectedMemberId } as any)
        .eq("id", linkingUser.id);

      if (linkingUser.email) {
        const { data: authUsers } = await supabase.from("profiles")
          .select("user_id")
          .eq("email", linkingUser.email)
          .limit(1);
        if (authUsers?.length) {
          await supabase.from("profiles")
            .update({ member_id: selectedMemberId } as any)
            .eq("user_id", authUsers[0].user_id);
        }
      }

      // Only update fields that were selected for merge
      const updates: any = {};
      if (mergeFields.phone && linkingUser.phone) updates.phone = linkingUser.phone;
      if (mergeFields.birth_date && linkingUser.birth_date) updates.birth_date = linkingUser.birth_date;
      if (mergeFields.email && linkingUser.email) updates.email = linkingUser.email;
      if (Object.keys(updates).length > 0) {
        await supabase.from("members").update(updates).eq("id", selectedMemberId);
      }

      toast({ title: "Vinculado!", description: `${linkingUser.full_name} vinculado ao membro existente.` });
      setLinkingUser(null);
      setSelectedMemberId(null);
      setExistingMember(null);
      fetchPending();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await supabase.from("pending_users" as any).update({ status: "rejeitado" } as any).eq("id", id);
      toast({ title: "Cadastro rejeitado." });
      fetchPending();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const pendingOnly = users.filter(u => u.status === "pendente");
  const processedOnly = users.filter(u => u.status !== "pendente");

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const ComparisonRow = ({ label, pendingValue, existingValue, field }: { label: string; pendingValue: string | null; existingValue: string | null; field: string }) => {
    const hasDiff = pendingValue && existingValue && pendingValue !== existingValue;
    const pendingHasData = !!pendingValue;
    const existingHasData = !!existingValue;
    
    return (
      <div className="grid grid-cols-[120px_1fr_40px_1fr] items-center gap-2 py-2 border-b border-border/50 last:border-0">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={`text-sm p-2 rounded ${pendingHasData ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted/30"}`}>
          {pendingValue || <span className="text-muted-foreground italic">Vazio</span>}
        </div>
        <div className="flex justify-center">
          {hasDiff ? (
            <Switch
              checked={mergeFields[field] || false}
              onCheckedChange={(v) => setMergeFields(prev => ({ ...prev, [field]: v }))}
            />
          ) : pendingHasData && !existingHasData ? (
            <Switch
              checked={mergeFields[field] || false}
              onCheckedChange={(v) => setMergeFields(prev => ({ ...prev, [field]: v }))}
            />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
        <div className={`text-sm p-2 rounded ${existingHasData ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/30"}`}>
          {existingValue || <span className="text-muted-foreground italic">Vazio</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Cadastros Pendentes ({pendingOnly.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOnly.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum cadastro pendente.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOnly.map(pu => (
                  <TableRow key={pu.id}>
                    <TableCell className="font-medium">{pu.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{pu.tipo === "visitante" ? "Visitante" : "Membro"}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{pu.email || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{pu.phone || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {new Date(pu.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" disabled={processing === pu.id} onClick={() => { setLinkingUser(pu); setSelectedMemberId(null); setExistingMember(null); }} title="Vincular a membro existente">
                          <Link2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="default" disabled={processing === pu.id} onClick={() => handleApprove(pu)} title="Aprovar como novo membro">
                          {processing === pu.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" variant="destructive" disabled={processing === pu.id} onClick={() => handleReject(pu.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {processedOnly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Histórico ({processedOnly.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedOnly.slice(0, 20).map(pu => (
                  <TableRow key={pu.id}>
                    <TableCell className="font-medium text-sm">{pu.full_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{pu.tipo}</Badge></TableCell>
                    <TableCell>
                      <Badge className={pu.status === "aprovado" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>
                        {pu.status === "aprovado" ? "Aprovado" : "Rejeitado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(pu.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Link to existing member modal with data comparison */}
      <Dialog open={!!linkingUser} onOpenChange={(open) => { if (!open) { setLinkingUser(null); setExistingMember(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Vincular a Membro Existente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Pending user info */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold mb-1">📋 Dados do Autocadastro</p>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <p><span className="text-muted-foreground">Nome:</span> {linkingUser?.full_name}</p>
                <p><span className="text-muted-foreground">Email:</span> {linkingUser?.email || "—"}</p>
                <p><span className="text-muted-foreground">Telefone:</span> {linkingUser?.phone || "—"}</p>
                <p><span className="text-muted-foreground">Nascimento:</span> {linkingUser?.birth_date ? new Date(linkingUser.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Buscar membro para vincular</Label>
              <MemberAutocomplete
                churchId={churchId}
                value={selectedMemberId || undefined}
                onChange={setSelectedMemberId}
                placeholder="Buscar membro existente..."
              />
            </div>

            {/* Comparison view */}
            {existingMember && linkingUser && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-medium">Compare os dados e escolha o que atualizar:</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="grid grid-cols-[120px_1fr_40px_1fr] items-center gap-2 pb-2 border-b mb-1">
                    <span className="text-xs font-bold">Campo</span>
                    <span className="text-xs font-bold text-amber-600">Autocadastro</span>
                    <span className="text-xs font-bold text-center">Usar</span>
                    <span className="text-xs font-bold text-emerald-600">Membro Existente</span>
                  </div>
                  <ComparisonRow label="Nome" pendingValue={linkingUser.full_name} existingValue={existingMember.full_name} field="full_name" />
                  <ComparisonRow label="Email" pendingValue={linkingUser.email} existingValue={existingMember.email} field="email" />
                  <ComparisonRow label="Telefone" pendingValue={linkingUser.phone} existingValue={existingMember.phone} field="phone" />
                  <ComparisonRow
                    label="Nascimento"
                    pendingValue={linkingUser.birth_date ? new Date(linkingUser.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : null}
                    existingValue={existingMember.birth_date ? new Date(existingMember.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : null}
                    field="birth_date"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ative o switch para usar os dados do autocadastro no lugar dos dados existentes.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkingUser(null); setExistingMember(null); }}>Cancelar</Button>
            <Button onClick={handleLinkToExisting} disabled={!selectedMemberId || processing === linkingUser?.id}>
              {processing === linkingUser?.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Vincular e Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
