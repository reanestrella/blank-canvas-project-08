import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Check, Clock } from "lucide-react";
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

export function MinistryCalendar({
  open,
  onOpenChange,
  schedules,
  ministryNames,
}: MinistryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const schedulesForDate = (date: Date) => {
    return schedules.filter((s) =>
      isSameDay(new Date(s.event_date), date)
    );
  };

  const selectedDaySchedules = selectedDate ? schedulesForDate(selectedDate) : [];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

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

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16" />
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
                      "h-16 p-1 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                      isSelected && "border-primary bg-primary/5",
                      isToday && !isSelected && "border-accent bg-accent/10"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      isToday && "text-primary font-bold"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {daySchedules.slice(0, 2).map((schedule) => (
                        <div
                          key={schedule.id}
                          className={cn(
                            "text-[10px] px-1 py-0.5 rounded text-white truncate",
                            getMinistryColor(ministryNames[schedule.ministry_id] || "")
                          )}
                          title={schedule.event_name}
                        >
                          {schedule.event_name}
                        </div>
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{daySchedules.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="w-64 border-l pl-4">
            {selectedDate ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                  </p>
                </div>

                <ScrollArea className="h-[400px]">
                  {selectedDaySchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calendar className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma escala neste dia
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {selectedDaySchedules.map((schedule) => {
                        const ministryName = ministryNames[schedule.ministry_id] || "Ministério";
                        const volunteers = schedule.volunteers || [];
                        const confirmedCount = volunteers.filter(v => v.confirmed).length;
                        
                        return (
                          <div
                            key={schedule.id}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                  getMinistryColor(ministryName)
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {schedule.event_name}
                                </p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {ministryName}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Volunteers Section */}
                            {volunteers.length > 0 ? (
                              <div className="mt-3 pt-3 border-t space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Voluntários
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {confirmedCount}/{volunteers.length} confirmados
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  {volunteers.map((vol) => (
                                    <div 
                                      key={vol.id} 
                                      className={cn(
                                        "flex items-center gap-2 p-2 rounded-md text-sm",
                                        vol.confirmed 
                                          ? "bg-green-500/10" 
                                          : "bg-yellow-500/10"
                                      )}
                                    >
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className={cn(
                                          "text-[10px] font-medium",
                                          vol.confirmed 
                                            ? "bg-green-500/20 text-green-700" 
                                            : "bg-yellow-500/20 text-yellow-700"
                                        )}>
                                          {vol.member ? getInitials(vol.member.full_name) : "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">
                                          {vol.member?.full_name || "Membro"}
                                        </p>
                                        {vol.role && (
                                          <p className="text-[10px] text-muted-foreground">{vol.role}</p>
                                        )}
                                      </div>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className={cn(
                                            "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                                            vol.confirmed 
                                              ? "bg-green-500 text-white" 
                                              : "bg-yellow-500 text-white"
                                          )}>
                                            {vol.confirmed ? (
                                              <Check className="w-2.5 h-2.5" />
                                            ) : (
                                              <Clock className="w-2.5 h-2.5" />
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          {vol.confirmed ? "Confirmado" : "Aguardando"}
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                Sem voluntários escalados
                              </p>
                            )}
                            
                            {schedule.notes && (
                              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                {schedule.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Calendar className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Selecione um dia para ver as escalas
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
