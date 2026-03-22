import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCheck, UserPlus, Link2, Search, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PendingProfile {
  user_id: string;
  full_name: string;
  email: string;
  registration_status: string;
  member_id: string | null;
  created_at?: string;
}

interface MemberOption {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

export function RegistrationApproval({ churchId }: { churchId: string }) {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pendente" | "ativo" | "todos">("pendente");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [assignRole, setAssignRole] = useState("membro");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, registration_status, member_id")
      .eq("church_id", churchId)
      .order("full_name");
    const all = (data as PendingProfile[]) || [];
    setAllProfiles(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, [churchId]);

  useEffect(() => {
    if (filter === "todos") setProfiles(allProfiles);
    else setProfiles(allProfiles.filter(p => p.registration_status === filter));
  }, [filter, allProfiles]);

  const openLinkModal = async (p: PendingProfile) => {
    setSelectedProfile(p);
    setSelectedMemberId(p.member_id);
    setMemberSearch("");
    setAssignRole("membro");
    // Load members
    const { data } = await supabase
      .from("members")
      .select("id, full_name, email, phone")
      .eq("church_id", churchId)
      .eq("is_active", true)
      .order("full_name");
    setMembers((data as MemberOption[]) || []);
    setLinkModalOpen(true);
  };

  const handleApprove = async (p: PendingProfile) => {
    await supabase.from("profiles").update({ registration_status: "ativo" } as any).eq("user_id", p.user_id);
    toast({ title: "Usuário aprovado!" });
    load();
  };

  const handleReject = async (p: PendingProfile) => {
    await supabase.from("profiles").update({ registration_status: "rejeitado" } as any).eq("user_id", p.user_id);
    toast({ title: "Cadastro rejeitado" });
    load();
  };

  const handleLinkAndApprove = async () => {
    if (!selectedProfile) return;
    setSaving(true);
    try {
      // Update profile with member_id and set active
      const updates: any = { registration_status: "ativo" };
      if (selectedMemberId) updates.member_id = selectedMemberId;
      
      await supabase.from("profiles").update(updates).eq("user_id", selectedProfile.user_id);

      // Assign role if specified
      if (assignRole) {
        await supabase.from("user_roles").upsert({
          user_id: selectedProfile.user_id,
          church_id: churchId,
          role: assignRole,
        } as any, { onConflict: "user_id,church_id,role" });
      }

      toast({ title: "Usuário vinculado e aprovado!" });
      setLinkModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleCreateMemberAndLink = async () => {
    if (!selectedProfile) return;
    setSaving(true);
    try {
      // Create member from profile data
      const { data: newMember, error: memberErr } = await supabase.from("members").insert({
        church_id: churchId,
        full_name: selectedProfile.full_name || "Novo Membro",
        email: selectedProfile.email || null,
        is_active: true,
      } as any).select("id").single();
      
      if (memberErr) throw memberErr;

      // Link and approve
      await supabase.from("profiles").update({
        member_id: newMember.id,
        registration_status: "ativo",
      } as any).eq("user_id", selectedProfile.user_id);

      // Assign role
      if (assignRole) {
        await supabase.from("user_roles").upsert({
          user_id: selectedProfile.user_id,
          church_id: churchId,
          role: assignRole,
        } as any, { onConflict: "user_id,church_id,role" });
      }

      toast({ title: "Membro criado, vinculado e aprovado!" });
      setLinkModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const filteredMembers = members.filter(m =>
    !memberSearch || m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const statusColors: Record<string, string> = {
    pendente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    ativo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    rejeitado: "bg-destructive/20 text-destructive",
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <UserCheck className="w-4 h-4 text-primary" />
          <span className="font-medium">Gerencie solicitações de cadastro e vínculos com membros</span>
        </div>
      </div>

      <div className="flex gap-2">
        {(["pendente", "ativo", "todos"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pendente" && allProfiles.filter(p => p.registration_status === "pendente").length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] py-0 h-4">
                {allProfiles.filter(p => p.registration_status === "pendente").length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {profiles.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          {filter === "pendente" ? "Nenhum cadastro pendente." : "Nenhum registro encontrado."}
        </CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map(p => (
              <TableRow key={p.user_id}>
                <TableCell className="font-medium">{p.full_name || "Sem nome"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.email || "—"}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] py-0 h-5 ${statusColors[p.registration_status] || ""}`}>
                    {p.registration_status || "ativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.member_id ? (
                    <Badge variant="outline" className="text-[10px] py-0 h-5 text-emerald-600">
                      <Link2 className="w-2.5 h-2.5 mr-0.5" /> Vinculado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 h-5 text-amber-600">Sem vínculo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => openLinkModal(p)}>
                      <Link2 className="w-3 h-3 mr-1" /> Vincular
                    </Button>
                    {p.registration_status === "pendente" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleApprove(p)}>
                          <Check className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReject(p)}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Usuário a Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm"><strong>Usuário:</strong> {selectedProfile?.full_name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">{selectedProfile?.email}</p>
            </div>

            {/* Option A: Link to existing member */}
            <div className="space-y-2">
              <Label className="font-semibold">Opção A — Vincular a membro existente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Buscar membro por nome ou email..."
                  className="pl-9"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
                {filteredMembers.slice(0, 20).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      selectedMemberId === m.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium">{m.full_name}</p>
                    {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum membro encontrado.</p>
                )}
              </div>
            </div>

            {/* Role assignment */}
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="lider_celula">Líder de Célula</SelectItem>
                  <SelectItem value="lider_ministerio">Líder de Ministério</SelectItem>
                  <SelectItem value="secretario">Secretário</SelectItem>
                  <SelectItem value="tesoureiro">Tesoureiro</SelectItem>
                  <SelectItem value="consolidacao">Consolidação</SelectItem>
                  <SelectItem value="pastor">Pastor/Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleCreateMemberAndLink()} disabled={saving}>
              <UserPlus className="w-4 h-4 mr-1" />
              {saving ? "Criando..." : "Opção B — Criar Novo Membro"}
            </Button>
            <Button onClick={handleLinkAndApprove} disabled={saving || !selectedMemberId}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Link2 className="w-4 h-4 mr-1" />}
              Vincular e Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
