import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { useMinistryVolunteers } from "@/hooks/useMinistryVolunteers";
import type { Member } from "@/hooks/useMembers";

interface VolunteersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  ministryName: string;
  members: Member[];
}

export function VolunteersModal({
  open,
  onOpenChange,
  ministryId,
  ministryName,
  members,
}: VolunteersModalProps) {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  
  const { volunteers, isLoading, addVolunteer, removeVolunteer } = useMinistryVolunteers(
    open ? ministryId : undefined
  );

  const availableMembers = members.filter(
    (m) => !volunteers.some((v) => v.member_id === m.id) && m.is_active
  );

  const handleAddVolunteer = async () => {
    if (!selectedMember) return;
    
    setIsAdding(true);
    await addVolunteer(selectedMember);
    setSelectedMember("");
    setIsAdding(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Voluntários - {ministryName}</DialogTitle>
          <DialogDescription>
            Gerencie os voluntários deste ministério
          </DialogDescription>
        </DialogHeader>

        {/* Add volunteer form */}
        <div className="flex gap-2 py-4 border-b">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um membro" />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Nenhum membro disponível
                </div>
              ) : (
                availableMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddVolunteer} 
            disabled={!selectedMember || isAdding}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Volunteers list */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : volunteers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <UserPlus className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Nenhum voluntário cadastrado
              </p>
            </div>
          ) : (
            volunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(volunteer.member?.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {volunteer.member?.full_name || "Membro não encontrado"}
                    </p>
                    {volunteer.member?.phone && (
                      <p className="text-xs text-muted-foreground">
                        {volunteer.member.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeVolunteer(volunteer.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {volunteers.length > 0 && (
          <div className="pt-4 border-t">
            <Badge variant="secondary">
              {volunteers.length} voluntário{volunteers.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
