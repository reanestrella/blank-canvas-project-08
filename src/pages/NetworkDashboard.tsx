import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Building2, Users, Grid3X3, TrendingUp, TrendingDown,
  PiggyBank, AlertTriangle, UserPlus, Network,
} from "lucide-react";

interface NetworkChurchData {
  id: string;
  name: string;
  is_active: boolean;
  member_count: number;
  cell_count: number;
  visitor_count: number;
  income: number;
  expense: number;
}

export default function NetworkDashboard() {
  const { user, profile, roles } = useAuth();
  const { isSuperAdmin, isChecking } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [churches, setChurches] = useState<NetworkChurchData[]>([]);
  const [networkName, setNetworkName] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const userRoles = roles.map(r => r.role);
  const isNetworkUser = userRoles.includes("network_admin" as any) || userRoles.includes("network_finance" as any);
  const networkId = (profile as any)?.ministry_network_id;

  const hasAccess = isSuperAdmin || isNetworkUser;

  useEffect(() => {
    if (!hasAccess) return;
    loadData();
  }, [hasAccess, filterYear, filterMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get churches in this network (or all for super_admin)
      let churchQuery = supabase.from("churches").select("id, name, is_active, ministry_network_id");
      if (!isSuperAdmin && networkId) {
        churchQuery = churchQuery.eq("ministry_network_id", networkId);
      }
      const { data: churchesRaw } = await churchQuery;
      if (!churchesRaw) { setLoading(false); return; }

      // Get network name
      if (networkId) {
        const { data: net } = await supabase
          .from("ministries_network")
          .select("name")
          .eq("id", networkId)
          .maybeSingle();
        if (net) setNetworkName((net as any).name);
      } else if (isSuperAdmin) {
        setNetworkName("Visão Global da Plataforma");
      }

      const churchIds = churchesRaw.map((c: any) => c.id);

      // Build date filter
      let dateFrom = `${filterYear}-01-01`;
      let dateTo = `${filterYear}-12-31`;
      if (filterMonth !== "all") {
        const m = parseInt(filterMonth) + 1;
        dateFrom = `${filterYear}-${String(m).padStart(2, "0")}-01`;
        const lastDay = new Date(filterYear, m, 0).getDate();
        dateTo = `${filterYear}-${String(m).padStart(2, "0")}-${lastDay}`;
      }

      // Aggregate data per church
      const enriched: NetworkChurchData[] = await Promise.all(
        (churchesRaw as any[]).map(async (ch) => {
          const [members, cells, visitors, transactions] = await Promise.all([
            supabase.from("members").select("id", { count: "exact", head: true }).eq("church_id", ch.id).eq("is_active", true),
            supabase.from("cells").select("id", { count: "exact", head: true }).eq("church_id", ch.id).eq("is_active", true),
            supabase.from("cell_visitors").select("id", { count: "exact", head: true }).eq("church_id", ch.id).gte("visit_date", dateFrom).lte("visit_date", dateTo),
            supabase.from("financial_transactions").select("type, amount").eq("church_id", ch.id).gte("transaction_date", dateFrom).lte("transaction_date", dateTo),
          ]);

          const txs = (transactions.data || []) as any[];
          const income = txs.filter(t => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
          const expense = txs.filter(t => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);

          return {
            id: ch.id,
            name: ch.name,
            is_active: ch.is_active,
            member_count: members.count || 0,
            cell_count: cells.count || 0,
            visitor_count: visitors.count || 0,
            income,
            expense,
          };
        })
      );

      setChurches(enriched);
    } catch (err) {
      console.error("[NetworkDashboard]", err);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasAccess) return <Navigate to="/app" replace />;

  const totals = useMemo(() => ({
    churches: churches.length,
    members: churches.reduce((s, c) => s + c.member_count, 0),
    cells: churches.reduce((s, c) => s + c.cell_count, 0),
    visitors: churches.reduce((s, c) => s + c.visitor_count, 0),
    income: churches.reduce((s, c) => s + c.income, 0),
    expense: churches.reduce((s, c) => s + c.expense, 0),
  }), [churches]);

  const balance = totals.income - totals.expense;
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // Alerts
  const alerts = useMemo(() => {
    const items: string[] = [];
    churches.forEach(c => {
      if (c.visitor_count === 0) items.push(`${c.name}: nenhum visitante no período`);
      if (c.income === 0 && c.expense === 0) items.push(`${c.name}: sem movimentação financeira`);
      if (!c.is_active) items.push(`${c.name}: igreja inativa`);
    });
    return items;
  }, [churches]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">{networkName || "Painel da Rede Ministerial"}</h1>
            <p className="text-xs text-muted-foreground">Visão consolidada de todas as igrejas</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { icon: Building2, label: "Igrejas", value: totals.churches, color: "text-primary" },
                { icon: Users, label: "Membros", value: totals.members, color: "text-primary" },
                { icon: Grid3X3, label: "Células", value: totals.cells, color: "text-primary" },
                { icon: UserPlus, label: "Visitantes", value: totals.visitors, color: "text-secondary" },
                { icon: TrendingUp, label: "Entradas", value: fmt(totals.income), color: "text-emerald-600" },
                { icon: TrendingDown, label: "Saídas", value: fmt(totals.expense), color: "text-destructive" },
                { icon: PiggyBank, label: "Saldo", value: fmt(balance), color: balance >= 0 ? "text-emerald-600" : "text-destructive" },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <s.icon className={`w-5 h-5 ${s.color} mb-1`} />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Church Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Detalhamento por Igreja
                </CardTitle>
                <CardDescription>{churches.length} igrejas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Igreja</TableHead>
                        <TableHead className="text-right">Membros</TableHead>
                        <TableHead className="text-right">Células</TableHead>
                        <TableHead className="text-right">Visitantes</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {churches.map(c => {
                        const bal = c.income - c.expense;
                        return (
                          <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-right">{c.member_count}</TableCell>
                            <TableCell className="text-right">{c.cell_count}</TableCell>
                            <TableCell className="text-right">{c.visitor_count}</TableCell>
                            <TableCell className="text-right text-emerald-600">{fmt(c.income)}</TableCell>
                            <TableCell className="text-right text-destructive">{fmt(c.expense)}</TableCell>
                            <TableCell className={`text-right font-medium ${bal >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(bal)}</TableCell>
                            <TableCell>
                              <Badge variant={c.is_active ? "default" : "destructive"}>
                                {c.is_active ? "Ativa" : "Inativa"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            {alerts.length > 0 && (
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" /> Alertas Estratégicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {alerts.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
