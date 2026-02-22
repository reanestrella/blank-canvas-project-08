import { Grid3X3, Users, TrendingUp, MapPin, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useCells } from "@/hooks/useCells";

export function CellsOverview() {
  const { profile, hasRole, user } = useAuth();
  const churchId = profile?.church_id;
  const isOnlyCellLeader = hasRole("lider_celula") && !hasRole("pastor");
  const leaderMemberId = isOnlyCellLeader ? (profile?.member_id ?? null) : undefined;
  const leaderUserId = isOnlyCellLeader && !profile?.member_id ? (user?.id ?? null) : undefined;
  const { cells, isLoading } = useCells(churchId || undefined, leaderMemberId, leaderUserId);

  const activeCells = cells.filter(c => c.is_active);

  if (isLoading) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-6">
          <Grid3X3 className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Células</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (activeCells.length === 0) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-6">
          <Grid3X3 className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Células</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Grid3X3 className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">Nenhuma célula cadastrada ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Cadastre células para ver indicadores aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Células ({activeCells.length})</h3>
        </div>
      </div>
      <div className="grid gap-4">
        {activeCells.slice(0, 5).map((cell) => (
          <div
            key={cell.id}
            className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{cell.name}</h4>
                {cell.network && (
                  <p className="text-xs text-muted-foreground mt-0.5">{cell.network}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {cell.day_of_week && (
                <span>{cell.day_of_week}</span>
              )}
              {cell.address && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{cell.address}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
