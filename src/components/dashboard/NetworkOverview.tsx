import { Users, UserCheck, Baby, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
    { 
      name: "Homens", 
      value: stats.homens, 
      icon: Users, 
      color: "bg-primary",
      textColor: "text-primary"
    },
    { 
      name: "Mulheres", 
      value: stats.mulheres, 
      icon: UserCheck, 
      color: "bg-secondary",
      textColor: "text-secondary"
    },
    { 
      name: "Jovens", 
      value: stats.jovens, 
      icon: GraduationCap, 
      color: "bg-info",
      textColor: "text-info"
    },
    { 
      name: "Kids", 
      value: stats.kids, 
      icon: Baby, 
      color: "bg-success",
      textColor: "text-success"
    },
  ];

  const total = networks.reduce((acc, n) => acc + n.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Redes da Igreja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {networks.map((network) => {
          const percentage = total > 0 ? (network.value / total) * 100 : 0;
          return (
            <div key={network.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${network.color}/10`}>
                    <network.icon className={`w-4 h-4 ${network.textColor}`} />
                  </div>
                  <span className="text-sm font-medium">{network.name}</span>
                </div>
                <span className="text-sm font-semibold">{network.value}</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total em Redes</span>
            <span className="font-semibold">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
