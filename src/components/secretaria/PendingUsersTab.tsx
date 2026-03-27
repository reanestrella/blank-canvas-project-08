import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

export function PendingUsersTab({ churchId }: { churchId: string }) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
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

  const handleApprove = async (pu: PendingUser) => {
    setProcessing(pu.id);
    try {
      // Create member record
      const { data: newMember, error: memberErr } = await supabase.from("members").insert({
        church_id: churchId,
        full_name: pu.full_name,
        email: pu.email,
        phone: pu.phone,
        birth_date: pu.birth_date,
        spiritual_status: pu.tipo === "visitante" ? "visitante" : "membro",
        is_active: true,
      }).select().single();

      if (memberErr) throw memberErr;

      // Update pending_users status
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
                  <TableHead className="w-[120px]">Ações</TableHead>
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
                        <Button size="sm" variant="default" disabled={processing === pu.id} onClick={() => handleApprove(pu)}>
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
    </div>
  );
}
