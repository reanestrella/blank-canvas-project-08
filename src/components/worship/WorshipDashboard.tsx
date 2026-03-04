import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Music } from "lucide-react";
import { useWorshipStats } from "@/hooks/useWorshipSongs";

interface Props {
  churchId: string;
}

export function WorshipDashboard({ churchId }: Props) {
  const { stats, isLoading } = useWorshipStats(churchId);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Registre cultos com músicas para ver as estatísticas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Músicas Mais Tocadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.slice(0, 20).map((s, idx) => (
              <div key={s.song_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  idx < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {idx + 1}
                </span>
                <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.title}</p>
                  {s.artist && <p className="text-xs text-muted-foreground">{s.artist}</p>}
                </div>
                {s.key_signature && (
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">{s.key_signature}</Badge>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground flex-shrink-0">
                  <span>Mês: <strong className="text-foreground">{s.played_month}</strong></span>
                  <span>Ano: <strong className="text-foreground">{s.played_year}</strong></span>
                  <span>Total: <strong className="text-foreground">{s.played_total}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
