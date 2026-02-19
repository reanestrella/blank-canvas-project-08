import { Grid3X3, Users, TrendingUp, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const cells = [
  {
    id: 1,
    name: "Célula Vida Nova",
    leader: "João Silva",
    members: 12,
    maxMembers: 15,
    visitors: 3,
    location: "Zona Norte",
    growth: 15,
  },
  {
    id: 2,
    name: "Célula Renovação",
    leader: "Maria Santos",
    members: 10,
    maxMembers: 15,
    visitors: 1,
    location: "Centro",
    growth: 8,
  },
  {
    id: 3,
    name: "Célula Esperança",
    leader: "Pedro Costa",
    members: 14,
    maxMembers: 15,
    visitors: 2,
    location: "Zona Sul",
    growth: 20,
  },
  {
    id: 4,
    name: "Célula Fé",
    leader: "Ana Lima",
    members: 8,
    maxMembers: 15,
    visitors: 4,
    location: "Zona Leste",
    growth: 25,
  },
];

export function CellsOverview() {
  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Células em Destaque</h3>
        </div>
        <button className="text-sm text-secondary hover:underline font-medium">
          Ver todas
        </button>
      </div>
      <div className="grid gap-4">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold">{cell.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Líder: {cell.leader}
                </p>
              </div>
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                +{cell.growth}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{cell.members}/{cell.maxMembers} membros</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{cell.location}</span>
                </div>
              </div>
              <Progress 
                value={(cell.members / cell.maxMembers) * 100} 
                className="h-2"
              />
              <p className="text-xs text-secondary font-medium">
                {cell.visitors} visitantes esta semana
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
