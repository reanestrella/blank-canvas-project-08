import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { Users, Link2, UserPlus, Loader2, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppUser {
  user_id: string;
  full_name: string;
  email: string;
  church_id: string | null;
  member_id: string | null;
  avatar_url: string | null;
}

interface AppUsersTabProps {
  churchId: string;
}

export function AppUsersTab({ churchId }: AppUsersTabProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingUser, setLinkingUser] = useState<AppUser | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, church_id, member_id, avatar_url")
        .eq("church_id", churchId)
        .order("full_name");
      if (error) throw error;
      setUsers((data as AppUser[]) || []);
    } catch (err) {
      console.error("Error fetching app users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (churchId) fetchUsers();
  }, [churchId]);

  const handleLinkMember = async () => {
    if (!linkingUser || !selectedMemberId) return;
    try {
      // Update profile with member_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ member_id: selectedMemberId } as any)
        .eq("user_id", linkingUser.user_id);
      if (profileError) throw profileError;

      toast({ title: "Usuário vinculado ao membro com sucesso!" });
      setLinkingUser(null);
      setSelectedMemberId(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao vincular", description: err.message, variant: "destructive" });
    }
  };

  const handleUnlinkMember = async (user: AppUser) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ member_id: null } as any)
        .eq("user_id", user.user_id);
      if (error) throw error;

      toast({ title: "Vínculo removido!" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const linked = users.filter(u => u.member_id);
  const unlinked = users.filter(u => !u.member_id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{linked.length}</p>
            <p className="text-xs text-muted-foreground">Vinculados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{unlinked.length}</p>
            <p className="text-xs text-muted-foreground">Não Vinculados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário do app</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.full_name || "Sem nome"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.member_id ? (
                        <Badge className="bg-success/20 text-success">Vinculado</Badge>
                      ) : (
                        <Badge variant="destructive">Não vinculado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.member_id ? (
                        <Button size="sm" variant="ghost" onClick={() => handleUnlinkMember(user)}>
                          <Unlink className="w-3 h-3 mr-1" /> Desvincular
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setLinkingUser(user); setSelectedMemberId(null); }}>
                          <Link2 className="w-3 h-3 mr-1" /> Vincular
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Link Member Modal */}
      <Dialog open={!!linkingUser} onOpenChange={(open) => !open && setLinkingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Usuário a Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vincule <strong>{linkingUser?.full_name}</strong> ({linkingUser?.email}) a um membro existente.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecionar Membro</label>
              <MemberAutocomplete
                churchId={churchId}
                value={selectedMemberId || undefined}
                onChange={setSelectedMemberId}
                placeholder="Buscar membro..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingUser(null)}>Cancelar</Button>
            <Button onClick={handleLinkMember} disabled={!selectedMemberId}>
              <UserPlus className="w-4 h-4 mr-2" /> Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
