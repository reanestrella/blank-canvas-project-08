import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Grid3X3, Loader2, Users, TrendingUp } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--info))", "hsl(var(--accent))"];

interface CellReportData {
  cell_id: string;
  report_date: string;
  attendance: number;
  visitors: number;
  conversions: number;
}

interface CellBasic {
  id: string;
  name: string;
  network: string | null;
  is_active: boolean;
}

export function CellChartsCard() {
  const { currentChurchId } = useAuth();
  const [cells, setCells] = useState<CellBasic[]>([]);
  const [reports, setReports] = useState<CellReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentChurchId) return;

    const fetch = async () => {
      setIsLoading(true);
      const [cellsRes, reportsRes] = await Promise.all([
        supabase.from("cells").select("id, name, network, is_active").eq("church_id", currentChurchId),
        supabase.from("cell_reports").select("cell_id, report_date, attendance, visitors, conversions")
          .eq("church_id", currentChurchId)
          .order("report_date", { ascending: true })
          .limit(500),
      ]);
      setCells((cellsRes.data as CellBasic[]) || []);
      setReports((reportsRes.data as CellReportData[]) || []);
      setIsLoading(false);
    };
    fetch();
  }, [currentChurchId]);

  const activeCells = cells.filter(c => c.is_active);

  // Attendance by month (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString("pt-BR", { month: "short" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      });
    }

    return months.map(m => {
      const monthReports = reports.filter(r => r.report_date.startsWith(m.key));
      return {
        name: m.label,
        presença: monthReports.reduce((s, r) => s + r.attendance, 0),
        visitantes: monthReports.reduce((s, r) => s + r.visitors, 0),
        decisões: monthReports.reduce((s, r) => s + r.conversions, 0),
      };
    });
  }, [reports]);

  // Cells by network
  const networkData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeCells.forEach(c => {
      const net = c.network || "Sem rede";
      counts[net] = (counts[net] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activeCells]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (activeCells.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly attendance chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Células - Presença Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="presença" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visitantes" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="decisões" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cells by network pie chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-secondary" />
            Células por Rede ({activeCells.length} ativas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={networkData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {networkData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
