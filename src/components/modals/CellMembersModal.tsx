import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserPlus, UserMinus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Cell } from "@/hooks/useCells";
import type { Member } from "@/hooks/useMembers";

interface CellMember {
  id: string;
  cell_id: string;
  member_id: string;
  joined_at: string;
}

interface CellMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: Cell;
  churchMembers: Member[];
  onMembersUpdated?: () => void;
}

export function CellMembersModal({
  open,
  onOpenChange,
  cell,
  churchMembers,
  onMembersUpdated,
}: CellMembersModalProps) {
  const [cellMembers, setCellMembers] = useState<CellMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch current cell members
  const fetchCellMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("cell_members")
        .select("*")
        .eq("cell_id", cell.id);

      if (error) throw error;
      setCellMembers(data || []);
    } catch (error: any) {
      console.error("Error fetching cell members:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os membros da célula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && cell) {
      fetchCellMembers();
    }
  }, [open, cell]);

  const isMemberInCell = (memberId: string) => {
    return cellMembers.some((cm) => cm.member_id === memberId);
  };

  const handleToggleMember = async (member: Member) => {
    setIsSaving(true);
    try {
      const isInCell = isMemberInCell(member.id);

      if (isInCell) {
        // Remove from cell
        const { error } = await supabase
          .from("cell_members")
          .delete()
          .eq("cell_id", cell.id)
          .eq("member_id", member.id);

        if (error) throw error;

        setCellMembers((prev) => prev.filter((cm) => cm.member_id !== member.id));
        toast({
          title: "Membro removido",
          description: `${member.full_name} foi removido da célula.`,
        });
      } else {
        // Add to cell
        const { data, error } = await supabase
          .from("cell_members")
          .insert([{ cell_id: cell.id, member_id: member.id }])
          .select()
          .single();

        if (error) throw error;

        setCellMembers((prev) => [...prev, data as CellMember]);
        toast({
          title: "Membro adicionado",
          description: `${member.full_name} foi adicionado à célula.`,
        });
      }

      onMembersUpdated?.();
    } catch (error: any) {
      console.error("Error toggling member:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o membro.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter members by search
  const filteredMembers = churchMembers.filter((member) =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate into members in cell and available members
  const membersInCell = filteredMembers.filter((m) => isMemberInCell(m.id));
  const availableMembers = filteredMembers.filter((m) => !isMemberInCell(m.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Membros da Célula: {cell.name}
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova membros cadastrados na igreja para esta célula.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Members in Cell */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Na Célula ({membersInCell.length})
                  </h4>
                  {membersInCell.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Nenhum membro adicionado ainda.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {membersInCell.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                        >
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => handleToggleMember(member)}
                            disabled={isSaving}
                          />
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.phone || "Sem telefone"}</p>
                          </div>
                          {member.spiritual_status === "lider" && (
                            <Badge variant="secondary" className="text-xs">Líder</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Members */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <UserMinus className="w-4 h-4" />
                    Disponíveis ({availableMembers.length})
                  </h4>
                  {availableMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      {searchQuery ? "Nenhum resultado encontrado." : "Todos os membros já estão na célula."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => handleToggleMember(member)}
                            disabled={isSaving}
                          />
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground">{member.phone || "Sem telefone"}</p>
                          </div>
                          {member.network && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {member.network}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
