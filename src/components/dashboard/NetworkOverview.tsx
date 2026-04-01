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
    { 
      name: "Homens", 
      value: stats.homens, 
      icon: Users, 
      color: "bg-primary/10",
      textColor: "text-primary"
    },
    { 
      name: "Mulheres", 
      value: stats.mulheres, 
      icon: UserCheck, 
      color: "bg-pink-100 dark:bg-pink-900/20",
      textColor: "text-pink-600 dark:text-pink-400"
    },
    { 
      name: "Jovens", 
      value: stats.jovens, 
      icon: GraduationCap, 
      color: "bg-info/10",
      textColor: "text-info"
    },
    { 
      name: "Kids", 
      value: stats.kids, 
      icon: Baby, 
      color: "bg-success/10",
      textColor: "text-success"
    },
  ];

  const total = networks.reduce((acc, n) => acc + n.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Redes da Igreja</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {networks.map((network) => (
            <div key={network.name} className={`p-4 rounded-xl ${network.color} text-center`}>
              <network.icon className={`w-6 h-6 ${network.textColor} mx-auto mb-2`} />
              <p className="text-2xl font-bold">{network.value}</p>
              <p className="text-xs text-muted-foreground">{network.name}</p>
            </div>
          ))}
          <div className="p-4 rounded-xl bg-muted/50 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total em Redes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
