import { useState, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TitherSummary } from "@/hooks/useTithers";

interface TithersTableProps {
  tithers: TitherSummary[];
  months: string[];
}

export function TithersTable({ tithers, months }: TithersTableProps) {
  const [search, setSearch] = useState("");

  const displayMonths = useMemo(() => {
    return months.slice(-6).map((m) => ({
      key: m,
      label: format(new Date(m + "-01"), "MMM", { locale: ptBR }),
    }));
  }, [months]);

  const filteredTithers = useMemo(() => {
    if (!search.trim()) return tithers;
    return tithers.filter((t) =>
      t.member_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [tithers, search]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Dizimistas</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Membro</TableHead>
                {displayMonths.map((m) => (
                  <TableHead key={m.key} className="text-center capitalize w-[80px]">
                    {m.label}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total Ano</TableHead>
                <TableHead className="text-center">Frequência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTithers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayMonths.length + 3} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {search ? "Nenhum dizimista encontrado" : "Nenhum dízimo registrado"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTithers.map((tither) => (
                  <TableRow key={tither.member_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(tither.member_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{tither.member_name}</span>
                      </div>
                    </TableCell>
                    {displayMonths.map((m) => {
                      const amount = tither.monthly_data[m.key];
                      return (
                        <TableCell key={m.key} className="text-center">
                          {amount ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle2 className="w-4 h-4 text-success mb-0.5" />
                              <span className="text-xs text-muted-foreground">
                                R$ {amount.toLocaleString("pt-BR")}
                              </span>
                            </div>
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-semibold">
                      R$ {tither.total_year.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          tither.months_paid >= 10
                            ? "text-success border-success/30 bg-success/10"
                            : tither.months_paid >= 6
                            ? "text-amber-600 border-amber-500/30 bg-amber-500/10"
                            : "text-muted-foreground"
                        )}
                      >
                        {tither.months_paid}/12 meses
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
