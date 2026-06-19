import { useMemo, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { Users, Heart, Eye, TrendingUp, MapPin, Layers } from "lucide-react";
import type { Member } from "@/hooks/useMembers";

const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

const TICK_STYLE = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

const STATUS_COLORS: Record<string, string> = {
  membro: "hsl(var(--primary))",
  visitante: "hsl(var(--secondary))",
  novo_convertido: "hsl(var(--success))",
  lider: "hsl(var(--info))",
  discipulador: "hsl(var(--accent-foreground))",
  crianca: "hsl(var(--chart-5, 280 65% 60%))",
};

const STATUS_LABELS: Record<string, string> = {
  membro: "Membro",
  visitante: "Visitante",
  novo_convertido: "Decidido",
  lider: "Líder",
  discipulador: "Discipulador",
  crianca: "Criança",
};

const MINISTRY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--success))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(220 70% 50%)",
  "hsl(280 65% 60%)",
  "hsl(40 90% 55%)",
];

interface Props {
  members: Member[];
  churchId: string;
}

interface MinistryCount {
  name: string;
  value: number;
}

export function SecretariaDashboard({ members, churchId }: Props) {
  const [ministryData, setMinistryData] = useState<MinistryCount[]>([]);

  // Fetch members-per-ministry via join: ministry_role_members → ministry_roles → ministries
  useEffect(() => {
    if (!churchId) return;
    (async () => {
      const { data, error } = await supabase
        .from("ministry_role_members")
        .select("ministry_role_id, ministry_roles(ministry_id, ministries(name))")
        .eq("church_id", churchId)
        .eq("is_active", true) as any;

      if (error || !data) return;

      const counts: Record<string, number> = {};
      for (const row of data) {
        const name = row.ministry_roles?.ministries?.name;
        if (name) counts[name] = (counts[name] ?? 0) + 1;
      }
      setMinistryData(
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }))
      );
    })();
  }, [churchId]);

  const activeMembers = useMemo(() => members.filter(m => m.is_active), [members]);

  // Summary stats
  const summary = useMemo(() => ({
    total: activeMembers.length,
    membros: activeMembers.filter(m => ["membro", "lider", "discipulador"].includes(m.spiritual_status)).length,
    visitantes: activeMembers.filter(m => m.spiritual_status === "visitante").length,
    decididos: activeMembers.filter(m => m.spiritual_status === "novo_convertido").length,
  }), [activeMembers]);

  // Donut: by spiritual status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeMembers.forEach(m => {
      const s = m.spiritual_status || "membro";
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, value]) => ({ name: STATUS_LABELS[status] ?? status, value, status }))
      .sort((a, b) => b.value - a.value);
  }, [activeMembers]);

  // Bar: by neighborhood (top 10)
  const neighborhoodData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeMembers.forEach(m => {
      const n = m.neighborhood?.trim() || "Não informado";
      counts[n] = (counts[n] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([bairro, total]) => ({ bairro, total }));
  }, [activeMembers]);

  // Line: monthly growth (last 12 months, cumulative additions)
  const growthData = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      });
    }
    return months.map(m => ({
      name: m.label,
      cadastros: members.filter(mb => (mb.created_at ?? "").startsWith(m.key)).length,
    }));
  }, [members]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Ativo", value: summary.total, icon: Users, color: "primary" },
          { label: "Membros", value: summary.membros, icon: Users, color: "info" },
          { label: "Visitantes", value: summary.visitantes, icon: Eye, color: "secondary" },
          { label: "Decididos", value: summary.decididos, icon: Heart, color: "success" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${color}/10 text-${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut: status espiritual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {statusData.map((entry, i) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? MINISTRY_COLORS[i % MINISTRY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number, name: string) => {
                    const total = statusData.reduce((s, d) => s + d.value, 0);
                    return [`${value} (${total ? Math.round((value / total) * 100) : 0}%)`, name];
                  }}
                />
                <Legend
                  formatter={(value) => <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line: crescimento mensal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Cadastros por Mês (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={TICK_STYLE} />
                <YAxis allowDecimals={false} tick={TICK_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="cadastros"
                  name="Cadastros"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar: por bairro */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Membros por Bairro (top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {neighborhoodData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Nenhum bairro cadastrado ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={neighborhoodData} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="bairro"
                    tick={{ ...TICK_STYLE, fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={TICK_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="total" name="Membros" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut: por ministério */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Membros por Ministério
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ministryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Nenhum membro vinculado a ministérios ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={ministryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {ministryData.map((_, i) => (
                      <Cell key={i} fill={MINISTRY_COLORS[i % MINISTRY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => {
                      const total = ministryData.reduce((s, d) => s + d.value, 0);
                      return [`${value} (${total ? Math.round((value / total) * 100) : 0}%)`, name];
                    }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
