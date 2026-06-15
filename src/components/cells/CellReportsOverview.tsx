import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Users, Heart, DollarSign, Pencil, Percent, Eye, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Cell, CellReport } from "@/hooks/useCells";

interface CellReportsOverviewProps {
  cells: Cell[];
  reports: CellReport[];
  getMemberName: (id: string | null) => string | null;
  cellMemberCounts: Record<string, number>;
  onEditReport?: (report: CellReport) => void;
  onReportUpdated?: () => void;
  isLeader?: boolean;
  canDelete?: boolean;
  currentUserId?: string;
}

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = format(d, "MMMM yyyy", { locale: ptBR });
    options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export function CellReportsOverview({
  cells,
  reports,
  getMemberName,
  cellMemberCounts,
  onEditReport,
  onReportUpdated,
  isLeader = false,
  canDelete = false,
  currentUserId,
}: CellReportsOverviewProps) {
  const [selectedCellId, setSelectedCellId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctingValue, setCorrectingValue] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<CellReport | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCorrigir = (report: CellReport) => {
    setCorrectingId(report.id);
    setCorrectingValue(report.offering ? String(report.offering) : "");
  };

  const handleSaveCorrecao = async (reportId: string) => {
    const valor = parseFloat(correctingValue.replace(",", "."));
    if (isNaN(valor) || valor < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSavingId(reportId);
    const { data, error } = await supabase.rpc("corrigir_oferta_celula", {
      p_relatorio_id: reportId,
      p_novo_valor: valor,
    });
    if (error || (data as any)?.error) {
      toast({ title: "Erro", description: error?.message ?? (data as any)?.error, variant: "destructive" });
    } else {
      toast({ title: "Oferta reenviada", description: "O valor foi atualizado e voltou para análise do tesoureiro." });
      setCorrectingId(null);
      onReportUpdated?.();
    }
    setSavingId(null);
  };

  const handleDelete = async () => {
    if (!deletingReport) return;
    setDeletingId(deletingReport.id);
    const { data, error } = await supabase.rpc("excluir_relatorio_celula", {
      p_relatorio_id: deletingReport.id,
    });
    if (error || (data as any)?.error) {
      toast({ title: "Erro ao excluir", description: error?.message ?? (data as any)?.error, variant: "destructive" });
    } else {
      toast({ title: "Relatório excluído" });
      onReportUpdated?.();
    }
    setDeletingId(null);
    setDeletingReport(null);
  };

  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (selectedCellId !== "all") {
      filtered = filtered.filter((r) => r.cell_id === selectedCellId);
    }
    if (selectedMonth !== "all") {
      filtered = filtered.filter((r) => r.report_date.startsWith(selectedMonth));
    }
    return filtered;
  }, [reports, selectedCellId, selectedMonth]);

  // Total disciples for selected scope
  const totalDisciples = useMemo(() => {
    if (selectedCellId !== "all") return cellMemberCounts[selectedCellId] || 0;
    return Object.values(cellMemberCounts).reduce((s, c) => s + c, 0);
  }, [selectedCellId, cellMemberCounts]);

  // Per-report attendance % helper — uses ONLY disciples (attendance - visitors)
  const getReportAttendancePercent = (report: CellReport) => {
    const disciples = cellMemberCounts[report.cell_id] || 0;
    if (disciples <= 0) return 0;
    // attendance field includes visitors, so subtract them for disciple-only count
    const disciplePresent = Math.max(0, report.attendance - report.visitors);
    return Math.round((disciplePresent / disciples) * 100);
  };

  const summaryStats = useMemo(() => {
    const totalReports = filteredReports.length;
    const totalAttendance = filteredReports.reduce((sum, r) => sum + r.attendance, 0);
    const totalVisitors = filteredReports.reduce((sum, r) => sum + r.visitors, 0);
    const totalConversions = filteredReports.reduce((sum, r) => sum + r.conversions, 0);
    const totalOffering = filteredReports.reduce((sum, r) => sum + (r.offering || 0), 0);
    const avgAttendance = totalReports > 0 ? Math.round(totalAttendance / totalReports) : 0;
    
    // Average attendance % = average of each meeting's ((attendance - visitors)/disciples*100)
    const perMeetingPercents = filteredReports.map(r => {
      const disciples = cellMemberCounts[r.cell_id] || 0;
      const disciplePresent = Math.max(0, r.attendance - r.visitors);
      return disciples > 0 ? (disciplePresent / disciples) * 100 : 0;
    });
    const avgAttendancePercent = perMeetingPercents.length > 0
      ? Math.round(perMeetingPercents.reduce((s, p) => s + p, 0) / perMeetingPercents.length)
      : 0;

    return { totalReports, totalAttendance, totalVisitors, totalConversions, totalOffering, avgAttendance, avgAttendancePercent };
  }, [filteredReports, cellMemberCounts]);

  // Chart data: group by report_date
  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string; presenca: number; visitantes: number; decisoes: number; oferta: number; percentual: number; count: number }> = {};
    const sorted = [...filteredReports].sort((a, b) => a.report_date.localeCompare(b.report_date));
    for (const r of sorted) {
      const key = r.report_date;
      if (!grouped[key]) {
        grouped[key] = { date: key, presenca: 0, visitantes: 0, decisoes: 0, oferta: 0, percentual: 0, count: 0 };
      }
      grouped[key].presenca += r.attendance;
      grouped[key].visitantes += r.visitors;
      grouped[key].decisoes += r.conversions;
      grouped[key].oferta += r.offering || 0;
      const disciples = cellMemberCounts[r.cell_id] || 0;
      if (disciples > 0) {
        const disciplePresent = Math.max(0, r.attendance - r.visitors);
        grouped[key].percentual += (disciplePresent / disciples) * 100;
        grouped[key].count += 1;
      }
    }
    return Object.values(grouped).map(g => ({
      ...g,
      percentual: g.count > 0 ? Math.round(g.percentual / g.count) : 0,
    }));
  }, [filteredReports, cellMemberCounts]);

  const getCellName = (cellId: string) => cells.find((c) => c.id === cellId)?.name || "Célula desconhecida";

  const formatReportDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  console.log('[CellReportsOverview] currentUserId:', currentUserId);
  console.log('[CellReportsOverview] reports oferta_status/created_by:', reports?.map(r => ({ id: r.id, oferta_status: r.oferta_status, created_by: r.created_by })));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Célula:</span>
          <Select value={selectedCellId} onValueChange={setSelectedCellId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as células</SelectItem>
              {cells.map((cell) => (
                <SelectItem key={cell.id} value={cell.id}>{cell.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mês:</span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className={`grid grid-cols-2 md:grid-cols-4 ${isLeader ? "lg:grid-cols-6" : "lg:grid-cols-7"} gap-3`}>
        {[
          { icon: Calendar, label: "Reuniões", value: summaryStats.totalReports, color: "text-primary" },
          { icon: Users, label: "Discípulos", value: totalDisciples, color: "text-info" },
          { icon: Users, label: "Presenças", value: summaryStats.totalAttendance, color: "text-success" },
          { icon: Percent, label: "% Média Presença", value: `${summaryStats.avgAttendancePercent}%`, color: "text-secondary" },
          { icon: Eye, label: "Visitantes", value: summaryStats.totalVisitors, color: "text-secondary" },
          { icon: Heart, label: "Decisões", value: summaryStats.totalConversions, color: "text-accent" },
          ...(!isLeader ? [{ icon: DollarSign, label: "Ofertas", value: `R$ ${summaryStats.totalOffering.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "text-success" }] : []),
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className={`grid grid-cols-1 ${isLeader ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-4`}>
          {/* Attendance % chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">% Presença ao longo do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => { const [,m,d] = v.split("-"); return `${d}/${m}`; }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip labelFormatter={(v) => formatReportDate(v as string)} formatter={(v: number) => [`${v}%`, "% Presença"]} />
                  <Line type="monotone" dataKey="percentual" name="% Presença" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Visitors chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Visitantes ao longo do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => { const [,m,d] = v.split("-"); return `${d}/${m}`; }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => formatReportDate(v as string)} />
                  <Bar dataKey="visitantes" name="Visitantes" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {isLeader ? (
            /* Decisions chart for leader */
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Decisões ao longo do tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => { const [,m,d] = v.split("-"); return `${d}/${m}`; }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(v) => formatReportDate(v as string)} />
                    <Bar dataKey="decisoes" name="Decisões" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            /* Offerings + Decisions chart for pastor */
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ofertas e Decisões</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => { const [,m,d] = v.split("-"); return `${d}/${m}`; }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(v) => formatReportDate(v as string)} />
                    <Legend />
                    <Bar dataKey="oferta" name="Oferta (R$)" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="decisoes" name="Decisões" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Reuniões</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">Nenhum relatório encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCellId === "all" ? "Ainda não há relatórios cadastrados." : "Esta célula ainda não possui relatórios."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Célula</TableHead>
                    <TableHead className="text-center">Presença</TableHead>
                    <TableHead className="text-center">Visitantes</TableHead>
                    <TableHead className="text-center">Decisões</TableHead>
                    <TableHead className="text-center">% Presença</TableHead>
                    {!isLeader && <TableHead className="text-right">Oferta</TableHead>}
                    <TableHead>Observações</TableHead>
                    {onEditReport && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const isRejected = report.oferta_status === "rejeitada";
                    const isOwner = !!currentUserId && report.created_by === currentUserId;
                    const isCorrecting = correctingId === report.id;
                    return (
                    <TableRow key={report.id} className={isRejected ? "bg-destructive/5" : undefined}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          {formatReportDate(report.report_date)}
                          {isRejected && (
                            <Badge variant="destructive" className="w-fit gap-1 text-xs">
                              <AlertCircle className="w-3 h-3" /> Oferta rejeitada
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{getCellName(report.cell_id)}</Badge></TableCell>
                      <TableCell className="text-center"><span className="font-semibold text-success">{report.attendance}</span></TableCell>
                      <TableCell className="text-center"><span className="font-semibold text-secondary">{report.visitors}</span></TableCell>
                      <TableCell className="text-center"><span className="font-semibold text-info">{report.conversions}</span></TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getReportAttendancePercent(report) >= 80 ? "default" : getReportAttendancePercent(report) >= 50 ? "secondary" : "destructive"}>
                          {getReportAttendancePercent(report)}%
                        </Badge>
                      </TableCell>
                      {!isLeader && (
                        <TableCell className="text-right">
                          {report.offering ? (
                            <span className="text-success">R$ {Number(report.offering).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                      )}
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{report.notes || "-"}</TableCell>
                      {onEditReport && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {isRejected && !isCorrecting && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleCorrigir(report)}
                              >
                                Corrigir oferta
                              </Button>
                            )}
                            {isCorrecting && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">R$</span>
                                <Input
                                  className="h-7 w-24 text-xs"
                                  value={correctingValue}
                                  onChange={(e) => setCorrectingValue(e.target.value)}
                                  placeholder="0,00"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={savingId === report.id}
                                  onClick={() => handleSaveCorrecao(report.id)}
                                >
                                  {savingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enviar"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setCorrectingId(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                            {!isCorrecting && (
                              <Button variant="ghost" size="icon" onClick={() => onEditReport(report)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {!isCorrecting && canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletingReport(report)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingReport} onOpenChange={(open) => { if (!open) setDeletingReport(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir relatório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório de{" "}
              <strong>{deletingReport ? formatReportDate(deletingReport.report_date) : ""}</strong>
              {" "}da célula <strong>{deletingReport ? getCellName(deletingReport.cell_id) : ""}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
              onClick={handleDelete}
            >
              {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
