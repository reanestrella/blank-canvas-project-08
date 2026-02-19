import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Check, Loader2, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useMinistrySchedules, useScheduleVolunteers } from "@/hooks/useMinistrySchedules";
import { useMinistryVolunteers } from "@/hooks/useMinistryVolunteers";

const scheduleSchema = z.object({
  event_name: z.string().min(2, "Nome do evento é obrigatório"),
  event_date: z.string().min(1, "Data é obrigatória"),
  notes: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  ministryName: string;
}

export function ScheduleModal({
  open,
  onOpenChange,
  ministryId,
  ministryName,
}: ScheduleModalProps) {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [volunteerRole, setVolunteerRole] = useState("");

  const { schedules, isLoading, createSchedule, deleteSchedule } = useMinistrySchedules(
    open ? ministryId : undefined
  );
  const { volunteers: ministryVolunteers } = useMinistryVolunteers(
    open ? ministryId : undefined
  );
  const {
    volunteers: scheduleVolunteers,
    isLoading: loadingScheduleVol,
    addVolunteer,
    removeVolunteer,
    toggleConfirmation,
  } = useScheduleVolunteers(selectedSchedule || undefined);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_name: "",
      event_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setSelectedSchedule(null);
      setActiveTab("list");
    }
  }, [open, form]);

  const handleSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);
    const result = await createSchedule({
      event_name: data.event_name,
      event_date: data.event_date,
      notes: data.notes,
    });
    if (!result.error) {
      form.reset();
      setActiveTab("list");
    }
    setIsSubmitting(false);
  };

  const handleAddVolunteer = async () => {
    if (!selectedVolunteer || !selectedSchedule) return;
    await addVolunteer(selectedVolunteer, volunteerRole || undefined);
    setSelectedVolunteer("");
    setVolunteerRole("");
  };

  const availableForSchedule = ministryVolunteers.filter(
    (mv) => !scheduleVolunteers.some((sv) => sv.member_id === mv.member_id)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const upcomingSchedules = schedules.filter(
    (s) => new Date(s.event_date) >= new Date(new Date().toDateString())
  );
  const pastSchedules = schedules.filter(
    (s) => new Date(s.event_date) < new Date(new Date().toDateString())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Escalas - {ministryName}</DialogTitle>
          <DialogDescription>
            Gerencie as escalas e atribua voluntários aos eventos
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Escalas</TabsTrigger>
            <TabsTrigger value="new">Nova Escala</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-hidden flex flex-col mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma escala cadastrada</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("new")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira escala
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 flex-1 overflow-hidden">
                {/* Schedule list */}
                <div className="w-1/2 overflow-y-auto space-y-2 pr-2">
                  {upcomingSchedules.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Próximas
                      </p>
                      {upcomingSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={() => setSelectedSchedule(schedule.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedSchedule === schedule.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{schedule.event_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(schedule.event_date), "dd 'de' MMMM, yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSchedule(schedule.id);
                                if (selectedSchedule === schedule.id) {
                                  setSelectedSchedule(null);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {pastSchedules.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4">
                        Anteriores
                      </p>
                      {pastSchedules.slice(0, 5).map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={() => setSelectedSchedule(schedule.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors opacity-60 ${
                            selectedSchedule === schedule.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <p className="font-medium text-sm">{schedule.event_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(schedule.event_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Schedule volunteers */}
                <div className="w-1/2 border-l pl-4 overflow-y-auto">
                  {selectedSchedule ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Escalar voluntário</p>
                        <div className="flex gap-2 mb-2">
                          <Select
                            value={selectedVolunteer}
                            onValueChange={setSelectedVolunteer}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableForSchedule.length === 0 ? (
                                <div className="p-2 text-xs text-muted-foreground text-center">
                                  Todos os voluntários já foram escalados
                                </div>
                              ) : (
                                availableForSchedule.map((v) => (
                                  <SelectItem key={v.id} value={v.member_id}>
                                    {v.member?.full_name || "Voluntário"}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            onClick={handleAddVolunteer}
                            disabled={!selectedVolunteer}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Função (opcional)"
                          value={volunteerRole}
                          onChange={(e) => setVolunteerRole(e.target.value)}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Escalados ({scheduleVolunteers.length})
                        </p>
                        {loadingScheduleVol ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : scheduleVolunteers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum voluntário escalado
                          </p>
                        ) : (
                          scheduleVolunteers.map((sv) => (
                            <div
                              key={sv.id}
                              className="flex items-center justify-between p-2 rounded-lg border bg-card"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={sv.confirmed || false}
                                  onCheckedChange={(checked) =>
                                    toggleConfirmation(sv.id, !!checked)
                                  }
                                />
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(sv.member?.full_name || "?")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {sv.member?.full_name}
                                  </p>
                                  {sv.role && (
                                    <p className="text-xs text-muted-foreground">
                                      {sv.role}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {sv.confirmed && (
                                  <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400">
                                    <Check className="w-3 h-3 mr-1" />
                                    Confirmado
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                  onClick={() => removeVolunteer(sv.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Calendar className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Selecione uma escala para gerenciar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="event_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Evento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Culto de Domingo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais sobre a escala"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("list")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Criar Escala
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
