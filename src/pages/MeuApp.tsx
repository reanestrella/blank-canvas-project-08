import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Users, Bell, Calendar as CalendarIcon, BookOpen, Heart, MessageSquare,
  Clock, MapPin, Plus, Loader2, Camera, GraduationCap, Settings,
  List, CalendarDays, Check, X, DollarSign, QrCode, Copy,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditTab } from "@/components/meuapp/ProfileEditTab";
import { CoursesTab } from "@/components/meuapp/CoursesTab";
import { useNavigate } from "react-router-dom";
import { ptBR } from "date-fns/locale";
import { format, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface BirthdayMember {
  id: string;
  full_name: string;
  birth_date: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
}

interface MySchedule {
  id: string;
  schedule_id: string;
  role: string | null;
  confirmed: boolean | null;
  schedule: {
    id: string;
    event_name: string;
    event_date: string;
    notes: string | null;
    ministry: {
      name: string;
    } | null;
  } | null;
}

interface ContribuicaoData {
  pix_key: string | null;
  pix_key_type: string | null;
  pix_holder_name: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
}

function SchedulesView({ schedules, onConfirm }: { schedules: MySchedule[]; onConfirm: (sv: MySchedule) => void }) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const scheduleDates = useMemo(() => {
    const dates: Date[] = [];
    schedules.forEach(s => {
      if (s.schedule?.event_date) {
        dates.push(new Date(s.schedule.event_date + "T12:00:00"));
      }
    });
    return dates;
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    if (!selectedDate) return schedules;
    return schedules.filter(s => {
      if (!s.schedule?.event_date) return false;
      return isSameDay(new Date(s.schedule.event_date + "T12:00:00"), selectedDate);
    });
  }, [schedules, selectedDate]);

  const displaySchedules = viewMode === "calendar" ? filteredSchedules : schedules;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Minhas Escalas
        </h3>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => { setViewMode("list"); setSelectedDate(undefined); }}
          >
            <List className="w-4 h-4 mr-1" /> Lista
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays className="w-4 h-4 mr-1" /> Calendário
          </Button>
        </div>
      </div>

      {viewMode === "calendar" && (
        <Card>
          <CardContent className="p-4 flex justify-center overflow-hidden">
            <div className="w-full max-w-sm">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                modifiers={{ scheduled: scheduleDates }}
                modifiersClassNames={{ scheduled: "bg-primary/20 font-bold text-primary" }}
                className="rounded-md mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Você não está escalado(a) em nenhum evento.</p>
          </CardContent>
        </Card>
      ) : displaySchedules.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Nenhuma escala nesta data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displaySchedules.map((s) => {
            const eventDate = s.schedule ? new Date(s.schedule.event_date + "T12:00:00") : null;
            const isPast = eventDate ? eventDate < new Date(new Date().setHours(0,0,0,0)) : false;
            return (
              <Card key={s.id} className={isPast ? "opacity-60" : ""}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 flex-shrink-0">
                    <span className="text-xl font-bold text-primary">{eventDate?.getDate() || "?"}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {eventDate ? format(eventDate, "MMM", { locale: ptBR }) : ""}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{s.schedule?.event_name || "Evento"}</h4>
                    <p className="text-xs text-muted-foreground">{s.schedule?.ministry?.name || "Ministério"}{s.role ? ` • ${s.role}` : ""}</p>
                    {s.schedule?.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{s.schedule.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.confirmed ? (
                      <Badge variant="default" className="bg-emerald-600">
                        <Check className="w-3 h-3 mr-1" />Confirmado
                      </Badge>
                    ) : !isPast ? (
                      <Button size="sm" onClick={() => onConfirm(s)}>
                        <Check className="w-3 h-3 mr-1" />Confirmar
                      </Button>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContribuicaoView({ churchId }: { churchId: string }) {
  const [data, setData] = useState<ContribuicaoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data: settings } = await supabase
        .from("church_settings" as any)
        .select("pix_key, pix_key_type, pix_holder_name, bank_name, bank_agency, bank_account, bank_account_type")
        .eq("church_id", churchId)
        .maybeSingle();
      setData(settings as ContribuicaoData | null);
      setIsLoading(false);
    };
    load();
  }, [churchId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Chave Pix copiada." });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!data || (!data.pix_key && !data.bank_name)) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Dados de contribuição ainda não foram configurados.</p>
          <p className="text-xs text-muted-foreground mt-1">Peça ao pastor/admin para cadastrar as informações.</p>
        </CardContent>
      </Card>
    );
  }

  const pixTypeLabels: Record<string, string> = {
    cpf: "CPF", cnpj: "CNPJ", email: "E-mail", telefone: "Telefone", aleatoria: "Chave Aleatória",
  };

  return (
    <div className="space-y-4">
      {data.pix_key && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> Pix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pix_key_type && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">{pixTypeLabels[data.pix_key_type] || data.pix_key_type}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Chave:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{data.pix_key}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(data.pix_key!)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {data.pix_holder_name && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Favorecido:</span>
                <span className="font-medium">{data.pix_holder_name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data.bank_name && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Dados Bancários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ["Banco", data.bank_name],
              ["Agência", data.bank_agency],
              ["Conta", data.bank_account],
              ["Tipo", data.bank_account_type],
              ["Favorecido", data.pix_holder_name],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MeuApp() {
  const { profile, church, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [schedules, setSchedules] = useState<MySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.church_id) fetchData();
  }, [profile?.church_id]);

  const fetchData = async () => {
    if (!profile?.church_id) return;
    setIsLoading(true);
    try {
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("id, title, content, created_at")
        .eq("church_id", profile.church_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      setAnnouncements((announcementsData as Announcement[]) || []);

      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
      const { data: birthdayData } = await supabase
        .from("members")
        .select("id, full_name, birth_date")
        .eq("church_id", profile.church_id)
        .eq("is_active", true)
        .not("birth_date", "is", null);
      const monthBirthdays = (birthdayData || []).filter((m: any) => {
        if (!m.birth_date) return false;
        return m.birth_date.split("-")[1] === currentMonth;
      });
      setBirthdays(monthBirthdays as BirthdayMember[]);

      const today = now.toISOString().split("T")[0];
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, event_date, event_time, location")
        .eq("church_id", profile.church_id)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(5);
      setEvents((eventsData as UpcomingEvent[]) || []);

      // ======= SCHEDULE LOOKUP =======
      let memberId = profile.member_id;
      console.log("[MeuApp] Schedule lookup — profile.member_id:", memberId, "user_id:", user?.id);

      if (!memberId && profile.email) {
        const { data: memberByEmail } = await supabase
          .from("members")
          .select("id")
          .eq("church_id", profile.church_id!)
          .ilike("email", profile.email.trim())
          .limit(1);
        if (memberByEmail && memberByEmail.length > 0) {
          memberId = memberByEmail[0].id;
          console.log("[MeuApp] Found member_id via email fallback:", memberId);
        }
      }

      if (!memberId && profile.full_name) {
        const { data: memberByName } = await supabase
          .from("members")
          .select("id")
          .eq("church_id", profile.church_id!)
          .ilike("full_name", profile.full_name.trim())
          .limit(1);
        if (memberByName && memberByName.length > 0) {
          memberId = memberByName[0].id;
          console.log("[MeuApp] Found member_id via name fallback:", memberId);
        }
      }

      if (memberId) {
        const { data: svData, error: svError } = await supabase
          .from("schedule_volunteers")
          .select(`
            id, schedule_id, role, confirmed, member_id,
            schedule:ministry_schedules!inner(
              id, event_name, event_date, notes, ministry_id,
              ministry:ministries(name)
            )
          `)
          .eq("member_id", memberId);

        console.log("[MeuApp] schedule_volunteers query:", { count: svData?.length, error: svError?.message });

        if (svData && svData.length > 0) {
          const { data: churchMinistries } = await supabase
            .from("ministries")
            .select("id")
            .eq("church_id", profile.church_id!);
          const churchMinistryIds = new Set((churchMinistries || []).map((m: any) => m.id));

          const allSchedules: MySchedule[] = svData
            .map((sv: any) => {
              const sched = Array.isArray(sv.schedule) ? sv.schedule[0] : sv.schedule;
              if (!sched) return null;
              if (!churchMinistryIds.has(sched.ministry_id)) return null;
              return {
                id: sv.id,
                schedule_id: sv.schedule_id,
                role: sv.role,
                confirmed: sv.confirmed,
                schedule: {
                  id: sched.id,
                  event_name: sched.event_name,
                  event_date: sched.event_date,
                  notes: sched.notes,
                  ministry: Array.isArray(sched.ministry) ? sched.ministry[0] : sched.ministry,
                },
              };
            })
            .filter(Boolean) as MySchedule[];
          allSchedules.sort((a, b) => (a.schedule?.event_date || "").localeCompare(b.schedule?.event_date || ""));
          setSchedules(allSchedules);
          console.log("[MeuApp] Final schedules loaded:", allSchedules.length);
        } else {
          setSchedules([]);
        }
      } else {
        console.log("[MeuApp] No member_id resolved — cannot load schedules");
        setSchedules([]);
      }
    } catch (error) {
      console.error("[MeuApp] Error fetching data:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSchedule = async (sv: MySchedule) => {
    try {
      const { error } = await supabase
        .from("schedule_volunteers")
        .update({ confirmed: true })
        .eq("id", sv.id);
      if (error) throw error;
      setSchedules(prev => prev.map(s => s.id === sv.id ? { ...s, confirmed: true } : s));
      toast({ title: "Confirmado!", description: `Presença confirmada para "${sv.schedule?.event_name}".` });
    } catch (err: any) {
      console.error("[MeuApp] Error confirming schedule:", err);
      toast({ title: "Erro", description: "Não foi possível confirmar.", variant: "destructive" });
    }
  };

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="gradient-hero text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="w-20 h-20 border-4 border-primary-foreground/20 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="text-2xl bg-primary-foreground/20 text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold truncate">{profile?.full_name || "Membro"}</h1>
                  <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 flex-shrink-0">Membro</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm opacity-90">
                  <span className="truncate">{profile?.email || ""}</span>
                  {profile?.phone && <span>• {profile.phone}</span>}
                </div>
                <p className="text-sm opacity-70 mt-1 truncate">{church?.name || ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="courses">Cursos</TabsTrigger>
              <TabsTrigger value="schedules">Escalas</TabsTrigger>
              <TabsTrigger value="contribuicao">Contribuição</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="prayer">Oração</TabsTrigger>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Announcements */}
                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-secondary" />Avisos
                    </CardTitle>
                    {announcements.length > 0 && <Badge variant="secondary">{announcements.length}</Badge>}
                  </CardHeader>
                  <CardContent>
                    {announcements.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Nenhum aviso no momento.</p>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((item) => (
                          <div key={item.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                            <span className="text-xs text-muted-foreground mt-1 block">{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Birthdays */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-secondary" />Aniversariantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {birthdays.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Nenhum aniversariante este mês.</p>
                    ) : (
                      <div className="space-y-3">
                        {birthdays.slice(0, 5).map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                                {m.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{m.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.birth_date ? new Date(m.birth_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-secondary" />Próximos Eventos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Nenhum evento próximo.</p>
                    ) : (
                      <div className="space-y-3">
                        {events.slice(0, 4).map((evt) => (
                          <div key={evt.id} className="p-3 rounded-lg bg-muted/50">
                            <h4 className="font-medium text-sm">{evt.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(evt.event_date + "T12:00:00").toLocaleDateString("pt-BR")}
                              {evt.event_time && <span>• {evt.event_time}</span>}
                            </div>
                            {evt.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />{evt.location}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="courses" className="mt-6">
              <CoursesTab />
            </TabsContent>

            <TabsContent value="schedules" className="mt-6">
              <SchedulesView schedules={schedules} onConfirm={handleConfirmSchedule} />
            </TabsContent>

            <TabsContent value="contribuicao" className="mt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary" /> Contribuição
              </h3>
              {profile?.church_id ? (
                <ContribuicaoView churchId={profile.church_id} />
              ) : (
                <p className="text-muted-foreground">Igreja não identificada.</p>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-6 mt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Eventos
              </h3>
              {events.length === 0 ? (
                <Card><CardContent className="py-8"><p className="text-center text-muted-foreground">Nenhum evento próximo.</p></CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {events.map((evt) => (
                    <Card key={evt.id}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{evt.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(evt.event_date + "T12:00:00").toLocaleDateString("pt-BR")}
                          {evt.event_time && <span>• {evt.event_time}</span>}
                        </div>
                        {evt.location && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />{evt.location}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="prayer" className="space-y-6 mt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Pedidos de Oração
              </h3>
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Em breve você poderá enviar e acompanhar pedidos de oração.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <ProfileEditTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
