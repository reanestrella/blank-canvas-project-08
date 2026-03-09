import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type PeriodMode = "month" | "year" | "all";

interface FinancialFiltersProps {
  mode: PeriodMode;
  month: number;
  year: number;
  onModeChange: (mode: PeriodMode) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  accountFilter?: string;
  accounts?: { id: string; name: string }[];
  onAccountFilterChange?: (accountId: string) => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function FinancialFilters({
  mode,
  month,
  year,
  onModeChange,
  onMonthChange,
  onYearChange,
  accountFilter,
  accounts,
  onAccountFilterChange,
}: FinancialFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <Select value={mode} onValueChange={(v) => onModeChange(v as PeriodMode)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Mês</SelectItem>
          <SelectItem value="year">Ano</SelectItem>
          <SelectItem value="all">Todos</SelectItem>
        </SelectContent>
      </Select>

      {mode === "month" && (
        <Select value={String(month)} onValueChange={(v) => onMonthChange(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(mode === "month" || mode === "year") && (
        <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {accounts && accounts.length > 0 && onAccountFilterChange && (
        <Select value={accountFilter || "all"} onValueChange={onAccountFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todas as contas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
