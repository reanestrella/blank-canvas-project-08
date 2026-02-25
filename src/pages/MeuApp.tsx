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
  List, CalendarDays, Check,
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

function SchedulesView({ schedules }: { schedules: MySchedule[] }) {
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
                  <Badge variant={s.confirmed ? "default" : "secondary"} className="flex-shrink-0">
                    {s.confirmed ? <><Check className="w-3 h-3 mr-1" />Confirmado</> : "Pendente"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
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

      // ======= SCHEDULE LOOKUP (BUG #1 FIX) =======
      // Step 1: Find the member_id linked to this user
      let memberId = profile.member_id;
      console.log("[MeuApp] Schedule lookup — profile.member_id:", memberId, "profile.email:", profile.email);

      if (!memberId && profile.email) {
        const { data: memberData } = await supabase
          .from("members")
          .select("id")
          .eq("church_id", profile.church_id!)
          .ilike("email", profile.email)
          .limit(1);
        if (memberData && memberData.length > 0) {
          memberId = memberData[0].id;
          console.log("[MeuApp] Found member_id via email fallback:", memberId);
        }
      }

      if (memberId) {
        // Step 2: Query schedule_volunteers for this member
        const { data: svData, error: svError } = await supabase
          .from("schedule_volunteers")
          .select("id, schedule_id, role, confirmed, member_id")
          .eq("member_id", memberId);

        console.log("[MeuApp] schedule_volunteers query result:", { count: svData?.length, error: svError });

        if (svData && svData.length > 0) {
          const scheduleIds = [...new Set(svData.map(sv => sv.schedule_id))];
          
          // Step 3: Fetch ministry_schedules for those IDs, including ministry name
          const { data: schedulesData, error: schedError } = await supabase
            .from("ministry_schedules")
            .select("id, event_name, event_date, notes, ministry_id, ministry:ministries(name)")
            .in("id", scheduleIds)
            .order("event_date", { ascending: true });

          console.log("[MeuApp] ministry_schedules query result:", { count: schedulesData?.length, error: schedError });

          const scheduleMap = new Map((schedulesData || []).map((s: any) => [s.id, s]));
          const allSchedules: MySchedule[] = svData
            .map((sv: any) => {
              const sched = scheduleMap.get(sv.schedule_id);
              if (!sched) return null;
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
                  ministry: sched.ministry,
                },
              };
            })
            .filter(Boolean) as MySchedule[];
          allSchedules.sort((a, b) => (a.schedule?.event_date || "").localeCompare(b.schedule?.event_date || ""));
          setSchedules(allSchedules);
          console.log("[MeuApp] Final schedules loaded:", allSchedules.length);
        } else {
          console.log("[MeuApp] No schedule_volunteers found for member:", memberId);
          setSchedules([]);
        }
      } else {
        console.log("[MeuApp] No member_id found — cannot load schedules");
        setSchedules([]);
      }
    } catch (error) {
      console.error("[MeuApp] Error fetching data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do app.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

                {/* Events */}
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
                        {events.map((event) => (
                          <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-background">
                              <span className="text-xs font-bold text-primary">{new Date(event.event_date + "T12:00:00").getDate()}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{new Date(event.event_date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.event_time}</span>}
                                {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Heart className="w-6 h-6 text-secondary" /><span className="text-sm">Pedido de Oração</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <MessageSquare className="w-6 h-6 text-info" /><span className="text-sm">Testemunho</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => {}}>
                  <GraduationCap className="w-6 h-6 text-success" /><span className="text-sm">Meus Cursos</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary" /><span className="text-sm">Inscrições</span>
                </Button>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="mt-6">
              <CoursesTab />
            </TabsContent>

            {/* Schedules Tab */}
            <TabsContent value="schedules" className="mt-6">
              <SchedulesView schedules={schedules} />
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Próximos Eventos</CardTitle></CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum evento agendado.</p>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/10">
                            <span className="text-2xl font-bold text-primary">{new Date(event.event_date + "T12:00:00").getDate()}</span>
                            <span className="text-xs text-muted-foreground uppercase">{new Date(event.event_date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{event.title}</h4>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                              {event.event_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.event_time}</span>}
                              {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prayer Tab */}
            <TabsContent value="prayer" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-secondary" />Meus Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full mb-4 gradient-accent text-secondary-foreground"><Plus className="w-4 h-4 mr-2" />Novo Pedido de Oração</Button>
                    <p className="text-center text-muted-foreground py-8">Você ainda não tem pedidos cadastrados.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-secondary" />Pedidos da Comunidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">Nenhum pedido público no momento.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <ProfileEditTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
