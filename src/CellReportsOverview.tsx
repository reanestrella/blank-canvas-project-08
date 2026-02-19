import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Users, Heart, TrendingUp, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Cell, CellReport } from "@/hooks/useCells";

interface CellReportsOverviewProps {
  cells: Cell[];
  reports: CellReport[];
  getMemberName: (id: string | null) => string | null;
}

export function CellReportsOverview({
  cells,
  reports,
  getMemberName,
}: CellReportsOverviewProps) {
  const [selectedCellId, setSelectedCellId] = useState<string>("all");

  // Filter reports by selected cell
  const filteredReports = useMemo(() => {
    if (selectedCellId === "all") return reports;
    return reports.filter((r) => r.cell_id === selectedCellId);
  }, [reports, selectedCellId]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalReports = filteredReports.length;
    const totalAttendance = filteredReports.reduce((sum, r) => sum + r.attendance, 0);
    const totalVisitors = filteredReports.reduce((sum, r) => sum + r.visitors, 0);
    const totalConversions = filteredReports.reduce((sum, r) => sum + r.conversions, 0);
    const totalOffering = filteredReports.reduce((sum, r) => sum + (r.offering || 0), 0);
    const avgAttendance = totalReports > 0 ? Math.round(totalAttendance / totalReports) : 0;

    return {
      totalReports,
      totalAttendance,
      totalVisitors,
      totalConversions,
      totalOffering,
      avgAttendance,
    };
  }, [filteredReports]);

  // Get cell name by ID
  const getCellName = (cellId: string) => {
    const cell = cells.find((c) => c.id === cellId);
    return cell?.name || "Célula desconhecida";
  };

  // Format date safely
  const formatReportDate = (dateStr: string) => {
    try {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filtrar por célula:</span>
          <Select value={selectedCellId} onValueChange={setSelectedCellId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as células" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as células</SelectItem>
              {cells.map((cell) => (
                <SelectItem key={cell.id} value={cell.id}>
                  {cell.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Reuniões</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalReports}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Presenças</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalAttendance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-info" />
              <span className="text-sm text-muted-foreground">Média/Reunião</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.avgAttendance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Visitantes</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalVisitors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">Decisões</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summaryStats.totalConversions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Ofertas</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              R$ {summaryStats.totalOffering.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

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
                {selectedCellId === "all"
                  ? "Ainda não há relatórios cadastrados."
                  : "Esta célula ainda não possui relatórios."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Célula</TableHead>
                  <TableHead className="text-center">Presença</TableHead>
                  <TableHead className="text-center">Visitantes</TableHead>
                  <TableHead className="text-center">Decisões</TableHead>
                  <TableHead className="text-right">Oferta</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {formatReportDate(report.report_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCellName(report.cell_id)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-success">{report.attendance}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-secondary">{report.visitors}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-info">{report.conversions}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {report.offering ? (
                        <span className="text-success">
                          R$ {Number(report.offering).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {report.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
