import { useState, useEffect, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Building2, Users, Grid3X3, TrendingUp, TrendingDown,
  PiggyBank, AlertTriangle, UserPlus, Network, ArrowLeft,
  BarChart3, DollarSign, ChevronDown, ChevronUp, Wallet,
  Megaphone, Plus, Edit2, Trash2, GraduationCap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

interface NetworkChurchData {
  id: string;
  name: string;
  is_active: boolean;
  member_count: number;
  cell_count: number;
  visitor_count: number;
  decidido_count: number;
  baptized_count: number;
  consolidation_count: number;
  income: number;
  expense: number;
  all_time_income: number;
  all_time_expense: number;
  prev_month_balance: number;
}

export default function NetworkDashboard() {
  const { user, profile, roles } = useAuth();
  const { isSuperAdmin, isChecking } = useSuperAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [churches, setChurches] = useState<NetworkChurchData[]>([]);
  const [networkName, setNetworkName] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterChurch, setFilterChurch] = useState<string>("all");
  const [chartsOpen, setChartsOpen] = useState(false);

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
      let churchQuery = supabase.from("churches").select("id, name, is_active, ministry_network_id");
      if (!isSuperAdmin && networkId) {
        churchQuery = churchQuery.eq("ministry_network_id", networkId);
      }
      const { data: churchesRaw } = await churchQuery;
      if (!churchesRaw) { setLoading(false); return; }

      if (networkId) {
        const { data: net } = await supabase.from("ministries_network").select("name").eq("id", networkId).maybeSingle();
        if (net) setNetworkName((net as any).name);
      } else if (isSuperAdmin) {
        setNetworkName("Visão Global da Plataforma");
      }

      let dateFrom = `${filterYear}-01-01`;
      let dateTo = `${filterYear}-12-31`;
      if (filterMonth !== "all") {
        const m = parseInt(filterMonth) + 1;
        dateFrom = `${filterYear}-${String(m).padStart(2, "0")}-01`;
        const lastDay = new Date(filterYear, m, 0).getDate();
        dateTo = `${filterYear}-${String(m).padStart(2, "0")}-${lastDay}`;
      }

      // Calculate prev month end date for "Saldo Mês Anterior"
      let prevMonthEnd: string | null = null;
      if (filterMonth !== "all") {
        const m = parseInt(filterMonth); // 0-indexed
        const prevDate = new Date(filterYear, m, 0); // last day of previous month
        prevMonthEnd = prevDate.toISOString().split("T")[0];
      }

      const enriched: NetworkChurchData[] = await Promise.all(
        (churchesRaw as any[]).map(async (ch) => {
          const [membersData, cells, transactions, allTransactions, consolidation] = await Promise.all([
            supabase.from("members").select("id, spiritual_status, baptism_date, is_active").eq("church_id", ch.id),
            supabase.from("cells").select("id", { count: "exact", head: true }).eq("church_id", ch.id).eq("is_active", true),
            supabase.from("financial_transactions").select("type, amount").eq("church_id", ch.id).gte("transaction_date", dateFrom).lte("transaction_date", dateTo),
            supabase.from("financial_transactions").select("type, amount, transaction_date").eq("church_id", ch.id),
            supabase.from("consolidation_records").select("id", { count: "exact", head: true }).eq("church_id", ch.id).in("status", ["contato", "acompanhamento", "integracao"]),
          ]);
          const activeMembers = ((membersData.data || []) as any[]).filter(m => m.is_active);
          const txs = (transactions.data || []) as any[];
          const allTxs = (allTransactions.data || []) as any[];

          const allTimeIncome = allTxs.filter(t => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
          const allTimeExpense = allTxs.filter(t => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);

          let prevBalance = 0;
          if (prevMonthEnd) {
            const prevTxs = allTxs.filter(t => t.transaction_date <= prevMonthEnd);
            prevBalance = prevTxs.reduce((s, t) => s + (t.type === "receita" ? Number(t.amount) : -Number(t.amount)), 0);
          }

          return {
            id: ch.id, name: ch.name, is_active: ch.is_active,
            member_count: activeMembers.filter(m => m.spiritual_status === "membro" || m.spiritual_status === "lider" || m.spiritual_status === "discipulador").length,
            cell_count: cells.count || 0,
            visitor_count: activeMembers.filter(m => m.spiritual_status === "visitante").length,
            decidido_count: activeMembers.filter(m => m.spiritual_status === "novo_convertido").length,
            baptized_count: activeMembers.filter(m => m.baptism_date !== null).length,
            consolidation_count: consolidation.count || 0,
            income: txs.filter(t => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0),
            expense: txs.filter(t => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0),
            all_time_income: allTimeIncome,
            all_time_expense: allTimeExpense,
            prev_month_balance: prevBalance,
          };
        })
      );
      setChurches(enriched);
    } catch (err) { console.error("[NetworkDashboard]", err); }
    finally { setLoading(false); }
  };

  const displayChurches = useMemo(() => {
    if (filterChurch === "all") return churches;
    return churches.filter(c => c.id === filterChurch);
  }, [churches, filterChurch]);

  const totals = useMemo(() => ({
    churches: displayChurches.length,
    members: displayChurches.reduce((s, c) => s + c.member_count, 0),
    cells: displayChurches.reduce((s, c) => s + c.cell_count, 0),
    visitors: displayChurches.reduce((s, c) => s + c.visitor_count, 0),
    decididos: displayChurches.reduce((s, c) => s + c.decidido_count, 0),
    baptized: displayChurches.reduce((s, c) => s + c.baptized_count, 0),
    consolidation: displayChurches.reduce((s, c) => s + c.consolidation_count, 0),
    income: displayChurches.reduce((s, c) => s + c.income, 0),
    expense: displayChurches.reduce((s, c) => s + c.expense, 0),
    allTimeIncome: displayChurches.reduce((s, c) => s + c.all_time_income, 0),
    allTimeExpense: displayChurches.reduce((s, c) => s + c.all_time_expense, 0),
    prevMonthBalance: displayChurches.reduce((s, c) => s + c.prev_month_balance, 0),
  }), [displayChurches]);

  const balance = totals.income - totals.expense;
  const totalBalance = totals.allTimeIncome - totals.allTimeExpense;
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const chartData = useMemo(() =>
    displayChurches.map(c => ({
      name: c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name,
      Membros: c.member_count,
      Células: c.cell_count,
      Visitantes: c.visitor_count,
    })), [displayChurches]);

  const financeChartData = useMemo(() =>
    displayChurches.map(c => ({
      name: c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name,
      Entradas: c.income,
      Saídas: c.expense,
    })), [displayChurches]);

  const alerts = useMemo(() => {
    const items: { type: "warning" | "danger" | "info"; text: string }[] = [];
    churches.forEach(c => {
      if (c.visitor_count === 0) items.push({ type: "warning", text: `${c.name}: nenhum visitante no período` });
      if (c.income === 0 && c.expense === 0) items.push({ type: "warning", text: `${c.name}: sem movimentação financeira` });
      if (!c.is_active) items.push({ type: "danger", text: `${c.name}: igreja inativa` });
      if (c.member_count > 0 && c.cell_count === 0) items.push({ type: "info", text: `${c.name}: sem células cadastradas` });
    });
    return items;
  }, [churches]);

  if (isChecking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasAccess) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">{networkName || "Painel da Rede Ministerial"}</h1>
            <p className="text-xs text-muted-foreground">Visão consolidada de todas as igrejas</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(isSuperAdmin ? "/master" : "/app")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
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
              <SelectItem value="all">Todos os meses</SelectItem>
              {months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterChurch} onValueChange={setFilterChurch}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as igrejas</SelectItem>
              {churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { icon: Building2, label: "Igrejas", value: totals.churches, color: "text-primary" },
                { icon: Users, label: "Membros", value: totals.members, color: "text-primary" },
                { icon: UserPlus, label: "Decididos", value: totals.decididos, color: "text-emerald-600" },
                { icon: UserPlus, label: "Visitantes", value: totals.visitors, color: "text-secondary" },
                { icon: Grid3X3, label: "Células", value: totals.cells, color: "text-primary" },
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { icon: UserPlus, label: "Em Consolidação", value: String(totals.consolidation), color: "text-secondary" },
                { icon: UserPlus, label: "Batizados", value: String(totals.baptized), color: "text-info" },
                { icon: TrendingUp, label: "Entradas", value: fmt(totals.income), color: "text-emerald-600" },
                { icon: TrendingDown, label: "Saídas", value: fmt(totals.expense), color: "text-destructive" },
                { icon: PiggyBank, label: "Saldo", value: fmt(balance), color: balance >= 0 ? "text-emerald-600" : "text-destructive" },
                ...(filterMonth !== "all" ? [{ icon: TrendingDown, label: "Saldo Mês Anterior", value: fmt(totals.prevMonthBalance), color: totals.prevMonthBalance >= 0 ? "text-emerald-600" : "text-destructive" }] : []),
                { icon: Wallet, label: "Saldo Total", value: fmt(totalBalance), color: totalBalance >= 0 ? "text-emerald-600" : "text-destructive" },
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

            {/* Charts - Collapsible, starts minimized */}
            {displayChurches.length > 1 && (
              <Collapsible open={chartsOpen} onOpenChange={setChartsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between gap-2 py-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Gráficos por Igreja</span>
                    </div>
                    {chartsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Membros, Células e Visitantes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Membros" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Células" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Visitantes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" /> Financeiro por Igreja</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={financeChartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Bar dataKey="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Church Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Detalhamento por Igreja</CardTitle>
                <CardDescription>{displayChurches.length} igrejas</CardDescription>
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
                        {filterMonth !== "all" && <TableHead className="text-right">Saldo Mês Ant.</TableHead>}
                        <TableHead className="text-right">Saldo Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayChurches.map(c => {
                        const bal = c.income - c.expense;
                        const totalBal = c.all_time_income - c.all_time_expense;
                        return (
                          <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-right">{c.member_count}</TableCell>
                            <TableCell className="text-right">{c.cell_count}</TableCell>
                            <TableCell className="text-right">{c.visitor_count}</TableCell>
                            <TableCell className="text-right text-emerald-600">{fmt(c.income)}</TableCell>
                            <TableCell className="text-right text-destructive">{fmt(c.expense)}</TableCell>
                            <TableCell className={`text-right font-medium ${bal >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(bal)}</TableCell>
                            {filterMonth !== "all" && (
                              <TableCell className={`text-right font-medium ${c.prev_month_balance >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                                {fmt(c.prev_month_balance)}
                              </TableCell>
                            )}
                            <TableCell className={`text-right font-medium ${totalBal >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(totalBal)}</TableCell>
                            <TableCell><Badge variant={c.is_active ? "default" : "destructive"}>{c.is_active ? "Ativa" : "Inativa"}</Badge></TableCell>
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
                  <CardTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="w-5 h-5" /> Alertas Estratégicos</CardTitle>
                  <CardDescription>{alerts.length} alertas identificados</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {alerts.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.type === "danger" ? "text-destructive" : a.type === "warning" ? "text-amber-500" : "text-primary"}`} />
                        <span>{a.text}</span>
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
