import { Users, UserCheck, Baby, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NetworkStats {
  homens: number;
  mulheres: number;
  jovens: number;
  kids: number;
}

interface NetworkOverviewProps {
  stats: NetworkStats;
  totalMembers: number;
}

export function NetworkOverview({ stats, totalMembers }: NetworkOverviewProps) {
  const networks = [
    { name: "Homens", value: stats.homens, icon: Users, color: "bg-primary/10", textColor: "text-primary" },
    { name: "Mulheres", value: stats.mulheres, icon: UserCheck, color: "bg-pink-100 dark:bg-pink-900/20", textColor: "text-pink-600 dark:text-pink-400" },
    { name: "Jovens", value: stats.jovens, icon: GraduationCap, color: "bg-info/10", textColor: "text-info" },
    { name: "Kids", value: stats.kids, icon: Baby, color: "bg-success/10", textColor: "text-success" },
  ];

  const total = networks.reduce((acc, n) => acc + n.value, 0);
  const maxVal = Math.max(...networks.map(n => n.value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          Redes da Igreja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {networks.map((network) => {
            const pct = Math.round((network.value / maxVal) * 100);
            return (
              <div key={network.name} className={`relative overflow-hidden rounded-2xl ${network.color} p-4 text-center`}>
                <network.icon className={`mx-auto mb-2 h-6 w-6 ${network.textColor}`} />
                <p className="text-2xl font-bold">{network.value}</p>
                <p className="text-xs text-muted-foreground">{network.name}</p>
                {/* Mini progress bar */}
                <div className="mx-auto mt-2 h-1 w-2/3 overflow-hidden rounded-full bg-background/50">
                  <div className={`h-full rounded-full ${network.textColor} bg-current opacity-40`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="relative overflow-hidden rounded-2xl bg-muted/50 p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total em Redes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
