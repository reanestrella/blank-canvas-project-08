import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Users,
  Bell,
  Calendar,
  BookOpen,
  Heart,
  MessageSquare,
  Settings,
  ChevronRight,
  Sparkles,
  Clock,
  MapPin,
  Plus,
  Loader2,
  Camera,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

export default function MeuApp() {
  const { profile, church } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [schedules, setSchedules] = useState<MySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.church_id) {
      fetchData();
    }
  }, [profile?.church_id]);

  const fetchData = async () => {
    if (!profile?.church_id) return;
    setIsLoading(true);
    
    try {
      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("id, title, content, created_at")
        .eq("church_id", profile.church_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      setAnnouncements((announcementsData as Announcement[]) || []);

      // Fetch birthdays this month
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
        const bd = m.birth_date.split("-");
        return bd[1] === currentMonth;
      });
      setBirthdays(monthBirthdays as BirthdayMember[]);

      // Fetch upcoming events
      const today = now.toISOString().split("T")[0];
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, event_date, event_time, location")
        .eq("church_id", profile.church_id)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(5);
      setEvents((eventsData as UpcomingEvent[]) || []);

      // Fetch my schedules (via member_id → schedule_volunteers)
      if (profile.member_id) {
        const { data: schedulesData } = await supabase
          .from("schedule_volunteers")
          .select(`
            id,
            schedule_id,
            role,
            confirmed,
            schedule:ministry_schedules(
              id,
              event_name,
              event_date,
              notes,
              ministry:ministries(name)
            )
          `)
          .eq("member_id", profile.member_id);
        
        const validSchedules = ((schedulesData as any[]) || [])
          .filter((s: any) => s.schedule && s.schedule.event_date >= today)
          .sort((a: any, b: any) => a.schedule.event_date.localeCompare(b.schedule.event_date));
        setSchedules(validSchedules as MySchedule[]);
      }
    } catch (error) {
      console.error("Error fetching MeuApp data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) || "?";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="gradient-hero text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-primary-foreground/20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-2xl bg-primary-foreground/20 text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{profile?.full_name || "Membro"}</h1>
                  <Badge className="bg-primary-foreground/20 text-primary-foreground border-0">
                    Membro
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm opacity-90">
                  <span>{profile?.email || ""}</span>
                  {profile?.phone && <span>• {profile.phone}</span>}
                </div>
                <p className="text-sm opacity-70 mt-1">{church?.name || ""}</p>
              </div>
              <Button variant="secondary" className="self-start">
                <Settings className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="schedules">Minhas Escalas</TabsTrigger>
              <TabsTrigger value="schedule">Eventos</TabsTrigger>
              <TabsTrigger value="prayer">Oração</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Announcements */}
                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-secondary" />
                      Avisos
                    </CardTitle>
                    {announcements.length > 0 && (
                      <Badge variant="secondary">{announcements.length} aviso(s)</Badge>
                    )}
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
                            <span className="text-xs text-muted-foreground mt-1 block">
                              {new Date(item.created_at).toLocaleDateString("pt-BR")}
                            </span>
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
                      <Heart className="w-5 h-5 text-secondary" />
                      Aniversariantes do Mês
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
                        {birthdays.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">+ {birthdays.length - 5} mais</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-secondary" />
                      Próximos Eventos
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
                              <span className="text-xs font-bold text-primary">
                                {new Date(event.event_date + "T12:00:00").getDate()}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {new Date(event.event_date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {event.event_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{event.event_time}
                                  </span>
                                )}
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{event.location}
                                  </span>
                                )}
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
                  <Heart className="w-6 h-6 text-secondary" />
                  <span className="text-sm">Pedido de Oração</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <MessageSquare className="w-6 h-6 text-info" />
                  <span className="text-sm">Testemunho</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <BookOpen className="w-6 h-6 text-success" />
                  <span className="text-sm">Meus Cursos</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  <span className="text-sm">Inscrições</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="schedules" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Minhas Escalas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Você não está escalado(a) em nenhum evento próximo.</p>
                  ) : (
                    <div className="space-y-3">
                      {schedules.map((s) => (
                        <div key={s.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/10">
                            <span className="text-2xl font-bold text-primary">
                              {s.schedule ? new Date(s.schedule.event_date + "T12:00:00").getDate() : "?"}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase">
                              {s.schedule ? new Date(s.schedule.event_date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" }) : ""}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{s.schedule?.event_name || "Evento"}</h4>
                            <p className="text-sm text-muted-foreground">
                              {s.schedule?.ministry?.name || "Ministério"}
                              {s.role ? ` • ${s.role}` : ""}
                            </p>
                          </div>
                          <Badge variant={s.confirmed ? "default" : "secondary"}>
                            {s.confirmed ? "Confirmado" : "Pendente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum evento agendado.</p>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/10">
                            <span className="text-2xl font-bold text-primary">{new Date(event.event_date + "T12:00:00").getDate()}</span>
                            <span className="text-xs text-muted-foreground uppercase">
                              {new Date(event.event_date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{event.title}</h4>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                              {event.event_time && (
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.event_time}</span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prayer" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-secondary" />
                      Meus Pedidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full mb-4 gradient-accent text-secondary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Pedido de Oração
                    </Button>
                    <p className="text-center text-muted-foreground py-8">
                      Você ainda não tem pedidos de oração cadastrados.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-secondary" />
                      Pedidos da Comunidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido público no momento.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
