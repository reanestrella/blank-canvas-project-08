import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Check, Clock, List, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ScheduleVolunteer {
  id: string;
  confirmed: boolean | null;
  role: string | null;
  member: {
    id: string;
    full_name: string;
  } | null;
}

interface Schedule {
  id: string;
  ministry_id: string;
  event_name: string;
  event_date: string;
  notes: string | null;
  volunteers?: ScheduleVolunteer[];
}

interface MinistryCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: Schedule[];
  ministryNames: Record<string, string>;
}

const ministryColors: Record<string, string> = {
  louvor: "bg-violet-500",
  midia: "bg-blue-500",
  diaconal: "bg-amber-500",
  kids: "bg-pink-500",
  default: "bg-primary",
};

const getMinistryColor = (name: string) => {
  const lowerName = name.toLowerCase();
  for (const [key, color] of Object.entries(ministryColors)) {
    if (lowerName.includes(key)) return color;
  }
  return ministryColors.default;
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

/** Safe date parser for DATE (YYYY-MM-DD) columns — avoids timezone shift */
const parseDate = (d: string) => new Date(d + "T12:00:00");

function ScheduleCard({ schedule, ministryName }: { schedule: Schedule; ministryName: string }) {
  const volunteers = schedule.volunteers || [];
  const confirmedCount = volunteers.filter(v => v.confirmed).length;

  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start gap-2 mb-2">
        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", getMinistryColor(ministryName))} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{schedule.event_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{ministryName}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(parseDate(schedule.event_date), "dd/MM/yyyy")}
            </span>
          </div>
        </div>
      </div>

      {volunteers.length > 0 ? (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Voluntários</p>
            <span className="text-xs text-muted-foreground">{confirmedCount}/{volunteers.length} confirmados</span>
          </div>
          <div className="space-y-1.5">
            {volunteers.map((vol) => (
              <div
                key={vol.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-sm",
                  vol.confirmed ? "bg-emerald-500/10" : "bg-amber-500/10"
                )}
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className={cn(
                    "text-[10px] font-medium",
                    vol.confirmed ? "bg-emerald-500/20 text-emerald-700" : "bg-amber-500/20 text-amber-700"
                  )}>
                    {vol.member ? getInitials(vol.member.full_name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{vol.member?.full_name || "Membro"}</p>
                  {vol.role && <p className="text-[10px] text-muted-foreground">{vol.role}</p>}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                      vol.confirmed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {vol.confirmed ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">{vol.confirmed ? "Confirmado" : "Aguardando"}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-2 italic">Sem voluntários escalados</p>
      )}

      {schedule.notes && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{schedule.notes}</p>
      )}
    </div>
  );
}

export function MinistryCalendar({ open, onOpenChange, schedules, ministryNames }: MinistryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthSchedules = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return schedules.filter(s => {
      const d = parseDate(s.event_date);
      return d >= start && d <= end;
    }).sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [schedules, currentMonth]);

  const schedulesForDate = (date: Date) => schedules.filter((s) => isSameDay(parseDate(s.event_date), date));

  const selectedDaySchedules = selectedDate ? schedulesForDate(selectedDate) : [];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  // Group agenda by date
  const agendaGroups = useMemo(() => {
    const groups: Record<string, Schedule[]> = {};
    monthSchedules.forEach(s => {
      if (!groups[s.event_date]) groups[s.event_date] = [];
      groups[s.event_date].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [monthSchedules]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendário de Escalas
          </DialogTitle>
          <DialogDescription>
            Visualize todas as escalas dos ministérios em um só lugar
          </DialogDescription>
        </DialogHeader>

        {/* View mode tabs + month nav */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="month" className="gap-1"><CalendarDays className="w-4 h-4" />Mês</TabsTrigger>
              <TabsTrigger value="agenda" className="gap-1"><List className="w-4 h-4" />Agenda</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-semibold capitalize min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {viewMode === "month" ? (
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14" />
                ))}
                {days.map((day) => {
                  const daySchedules = schedulesForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "h-14 p-1 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                        isSelected && "border-primary bg-primary/5",
                        isToday && !isSelected && "border-accent bg-accent/10"
                      )}
                    >
                      <div className={cn("text-xs font-medium mb-0.5", isToday && "text-primary font-bold")}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.id}
                            className={cn("text-[9px] px-1 py-0.5 rounded text-white truncate leading-tight", getMinistryColor(ministryNames[schedule.ministry_id] || ""))}
                            title={schedule.event_name}
                          >
                            {schedule.event_name}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-[9px] text-muted-foreground px-1">+{daySchedules.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details */}
            <div className="w-64 border-l pl-4 hidden sm:block">
              {selectedDate ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm">{format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{format(selectedDate, "EEEE", { locale: ptBR })}</p>
                  </div>
                  <ScrollArea className="h-[400px]">
                    {selectedDaySchedules.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhuma escala neste dia</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pr-4">
                        {selectedDaySchedules.map((schedule) => (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            ministryName={ministryNames[schedule.ministry_id] || "Ministério"}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Selecione um dia para ver as escalas</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Agenda View */
          <ScrollArea className="flex-1">
            {agendaGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma escala neste mês</p>
              </div>
            ) : (
              <div className="space-y-6 pr-4">
                {agendaGroups.map(([date, daySchedules]) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-3 sticky top-0 bg-background py-1 z-10">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 flex-shrink-0">
                        <span className="text-lg font-bold text-primary">{parseDate(date).getDate()}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {format(parseDate(date), "EEE", { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize">
                          {format(parseDate(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">{daySchedules.length} escala(s)</p>
                      </div>
                    </div>
                    <div className="space-y-2 ml-[60px]">
                      {daySchedules.map((schedule) => (
                        <ScheduleCard
                          key={schedule.id}
                          schedule={schedule}
                          ministryName={ministryNames[schedule.ministry_id] || "Ministério"}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
