import { useMemo, useState } from "react";
import { Cake, Gift, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToPdf } from "@/lib/pdfExport";

interface Member {
  id: string;
  full_name: string;
  birth_date: string | null;
  photo_url: string | null;
  phone?: string | null;
}

interface BirthdayCardProps {
  members: Member[];
  churchName?: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Parse a DATE string (YYYY-MM-DD) without UTC shift. */
function parseLocalDate(s: string): Date {
  // Append noon local time to bypass UTC interpretation of "YYYY-MM-DD".
  return new Date(s.length === 10 ? s + "T12:00:00" : s);
}

export function BirthdayCard({ members, churchName }: BirthdayCardProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const handlePrintMonth = () => {
    const list = members
      .filter((m) => m.birth_date && parseLocalDate(m.birth_date).getMonth() === selectedMonth)
      .sort((a, b) => parseLocalDate(a.birth_date!).getDate() - parseLocalDate(b.birth_date!).getDate());
    exportToPdf({
      title: `Aniversariantes de ${MONTHS[selectedMonth]}`,
      churchName,
      columns: [
        { header: "Nome", dataKey: "name" },
        { header: "Aniversário", dataKey: "date" },
        { header: "Telefone", dataKey: "phone" },
      ],
      rows: list.map((m) => ({
        name: m.full_name,
        date: m.birth_date ? parseLocalDate(m.birth_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "",
        phone: m.phone ?? "",
      })),
      filename: `aniversariantes_${MONTHS[selectedMonth].toLowerCase()}.pdf`,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const { byMonth, byWeek } = useMemo(() => {
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const byMonth = members
      .filter((m) => m.birth_date && parseLocalDate(m.birth_date).getMonth() === selectedMonth)
      .sort((a, b) => parseLocalDate(a.birth_date!).getDate() - parseLocalDate(b.birth_date!).getDate());

    const byWeek = members.filter((m) => {
      if (!m.birth_date) return false;
      const bd = parseLocalDate(m.birth_date);
      const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      return thisYearBd >= weekStart && thisYearBd <= weekEnd;
    });

    return { byMonth, byWeek };
  }, [members, selectedMonth]);

  const renderList = (list: Member[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Cake className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {list.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={member.photo_url || ""} />
              <AvatarFallback className="bg-secondary/20 text-secondary text-xs">
                {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.full_name}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {formatDate(member.birth_date!)}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-secondary" />
            Aniversariantes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handlePrintMonth} className="h-8 px-2">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="month" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="month" className="text-xs">
              Mês ({byMonth.length})
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs">
              Semana ({byWeek.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="month">
            {renderList(byMonth, "Nenhum aniversariante neste mês")}
          </TabsContent>
          <TabsContent value="week">
            {renderList(byWeek, "Nenhum aniversariante esta semana")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
