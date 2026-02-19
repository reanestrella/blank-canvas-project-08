import { Users, Heart, DollarSign, Calendar, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "member",
    icon: Users,
    title: "Novo membro cadastrado",
    description: "Maria Silva foi adicionada à secretaria",
    time: "Há 5 min",
    iconBg: "bg-info/10 text-info",
  },
  {
    id: 2,
    type: "cell",
    icon: Grid3X3,
    title: "Relatório de célula",
    description: "Célula Vida Nova - 12 presentes, 2 visitantes",
    time: "Há 30 min",
    iconBg: "bg-success/10 text-success",
  },
  {
    id: 3,
    type: "finance",
    icon: DollarSign,
    title: "Dízimo registrado",
    description: "R$ 500,00 - João Santos",
    time: "Há 1 hora",
    iconBg: "bg-secondary/10 text-secondary",
  },
  {
    id: 4,
    type: "ministry",
    icon: Heart,
    title: "Escala atualizada",
    description: "Ministério de Louvor - próximo domingo",
    time: "Há 2 horas",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    id: 5,
    type: "event",
    icon: Calendar,
    title: "Evento criado",
    description: "Encontro de Casais - 15/02/2024",
    time: "Há 3 horas",
    iconBg: "bg-warning/10 text-warning",
  },
];

export function RecentActivity() {
  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Atividade Recente</h3>
        <button className="text-sm text-secondary hover:underline font-medium">
          Ver tudo
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={cn("p-2 rounded-lg", activity.iconBg)}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
