import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Calendar, Users, Heart, TrendingUp, DollarSign, Pencil, Percent, Eye } from "lucide-react";
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
  isLeader?: boolean;
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
  isLeader = false,
}: CellReportsOverviewProps) {
  const [selectedCellId, setSelectedCellId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const monthOptions = useMemo(() => getMonthOptions(), []);

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
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{formatReportDate(report.report_date)}</TableCell>
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
                          <Button variant="ghost" size="icon" onClick={() => onEditReport(report)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
