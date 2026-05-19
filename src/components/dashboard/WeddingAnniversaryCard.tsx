import { useMemo, useState } from "react";
import { Heart, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  id: string;
  full_name: string;
  wedding_date: string | null;
  photo_url: string | null;
}

interface WeddingAnniversaryCardProps {
  /** All active members with optional wedding_date. Card filters internally. */
  members: Member[];
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parseLocalDate(s: string): Date {
  return new Date(s.length === 10 ? s + "T12:00:00" : s);
}

export function WeddingAnniversaryCard({ members }: WeddingAnniversaryCardProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getYearsMarried = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return now.getFullYear() - date.getFullYear();
  };

  const { byMonth, byWeek } = useMemo(() => {
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const byMonth = members
      .filter((m) => m.wedding_date && parseLocalDate(m.wedding_date).getMonth() === selectedMonth)
      .sort((a, b) => parseLocalDate(a.wedding_date!).getDate() - parseLocalDate(b.wedding_date!).getDate());

    const byWeek = members.filter((m) => {
      if (!m.wedding_date) return false;
      const wd = parseLocalDate(m.wedding_date);
      const thisYearWd = new Date(now.getFullYear(), wd.getMonth(), wd.getDate());
      return thisYearWd >= weekStart && thisYearWd <= weekEnd;
    });

    return { byMonth, byWeek };
  }, [members, selectedMonth]);

  const renderList = (list: Member[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Heart className="w-8 h-8 text-muted-foreground mb-2" />
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
              <AvatarFallback className="bg-destructive/20 text-destructive text-xs">
                {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {getYearsMarried(member.wedding_date!)} anos
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {formatDate(member.wedding_date!)}
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
            <HeartHandshake className="w-5 h-5 text-destructive" />
            Bodas de Casamento
          </CardTitle>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {renderList(byMonth, "Nenhum aniversário de casamento neste mês")}
          </TabsContent>
          <TabsContent value="week">
            {renderList(byWeek, "Nenhum aniversário de casamento esta semana")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
