import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, UserCheck, UserPlus, Search } from "lucide-react";
import { AttendanceItem } from "./AttendanceItem";

interface MemberEntry {
  id: string;
  memberId: string;
  memberName: string;
}

interface AttendanceListProps {
  members: MemberEntry[];
  loading: boolean;
  presencas: Record<string, boolean>;
  onToggle: (memberId: string) => void;
}

export function AttendanceList({ members, loading, presencas, onToggle }: AttendanceListProps) {
  const [search, setSearch] = useState("");
  const presentCount = Object.values(presencas).filter(Boolean).length;

  if (loading) {
    return (
      <div className="mt-4 border rounded-lg p-4 flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!Array.isArray(members) || members.length === 0) {
    return (
      <div className="mt-4 border rounded-lg p-4 flex flex-col items-center justify-center py-6 text-center">
        <UserPlus className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum membro cadastrado nesta célula.</p>
        <p className="text-xs text-muted-foreground">Adicione membros através do menu da célula.</p>
      </div>
    );
  }

  const filtered = search.trim()
    ? members.filter(m => m.memberName.toLowerCase().includes(search.toLowerCase()))
    : members;

  return (
    <div className="mt-2 border rounded-lg p-3 sm:p-4 overflow-hidden flex flex-col">
      {/* Header with counter */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
          <Users className="w-4 h-4" />
          Lista de Presença
        </h4>
        <Badge variant="secondary" className="text-xs sm:text-sm">
          <UserCheck className="w-3 h-3 mr-1" />
          {presentCount} / {members.length}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative mb-3 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
          {filtered.map((m) => (
            <AttendanceItem
              key={m.memberId}
              memberName={m.memberName}
              isPresent={!!presencas[m.memberId]}
              onToggle={() => onToggle(m.memberId)}
            />
          ))}
        </div>
        {filtered.length === 0 && search && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro encontrado.</p>
        )}
      </div>
    </div>
  );
}
