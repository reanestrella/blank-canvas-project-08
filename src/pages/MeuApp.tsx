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
  Church, Mic, Video, Newspaper, HandHeart, Grid3X3, Flame,
  Cake, HeartHandshake, Megaphone, Upload, Book,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditTab } from "@/components/meuapp/ProfileEditTab";
import { CoursesTab } from "@/components/meuapp/CoursesTab";
import { BibleReader } from "@/components/meuapp/BibleReader";
import { DevotionalView } from "@/components/meuapp/DevotionalView";
import { PrayerRequestView } from "@/components/meuapp/PrayerRequestView";
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

interface NetworkAnnouncement {
  id: string;
  title: string;
  content: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  created_at: string;
}

interface BirthdayMember {
  id: string;
  full_name: string;
  birth_date: string;
  photo_url?: string | null;
}

interface WeddingMember {
  id: string;
  full_name: string;
  wedding_date: string;
  photo_url?: string | null;
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

interface CoVolunteer {
  id: string;
  confirmed: boolean | null;
  role: string | null;
  member: { full_name: string } | null;
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

interface MinistryData {
  id: string;
  name: string;
  description: string | null;
  leader: { full_name: string } | null;
}

interface CellData {
  id: string;
  name: string;
  day_of_week: string | null;
  time: string | null;
  address: string | null;
  network: string | null;
  leader: { full_name: string } | null;
  cover_image_url: string | null;
  maps_link: string | null;
}

// ─── Schedules View ──────────────────────────────────
function SchedulesView({ schedules, onConfirm }: { schedules: MySchedule[]; onConfirm: (sv: MySchedule) => void }) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [coVolunteers, setCoVolunteers] = useState<Record<string, any>>({});
  const [loadingVols, setLoadingVols] = useState<string | null>(null);

  const scheduleDates = useMemo(() => {
    return schedules.map(s => s.schedule?.event_date ? new Date(s.schedule.event_date + "T12:00:00") : null).filter(Boolean) as Date[];
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    if (!selectedDate) return schedules;
    return schedules.filter(s => s.schedule?.event_date && isSameDay(new Date(s.schedule.event_date + "T12:00:00"), selectedDate));
  }, [schedules, selectedDate]);

  const displaySchedules = viewMode === "calendar" ? filteredSchedules : schedules;

  const loadCoVolunteers = async (scheduleId: string) => {
    if (expandedSchedule === scheduleId) { setExpandedSchedule(null); return; }
    setExpandedSchedule(scheduleId);
    if (coVolunteers[scheduleId]) return;
    setLoadingVols(scheduleId);
    try {
      const { data } = await supabase.from("schedule_volunteers").select("id, confirmed, role, member:members(full_name)").eq("schedule_id", scheduleId);
      const { data: songsData } = await supabase.from("schedule_songs" as any).select("id, order_index, song:worship_songs(title, key_signature, artist, chord_url, audio_url)").eq("schedule_id", scheduleId).order("order_index");
      setCoVolunteers(prev => ({ ...prev, [scheduleId]: { volunteers: data || [], songs: songsData || [] } }));
    } catch (err) { console.error("[MeuApp] Error loading schedule details:", err); }
    finally { setLoadingVols(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Minhas Escalas</h3>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => { setViewMode("list"); setSelectedDate(undefined); }}><List className="w-4 h-4 mr-1" /> Lista</Button>
          <Button variant={viewMode === "calendar" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("calendar")}><CalendarDays className="w-4 h-4 mr-1" /> Calendário</Button>
        </div>
      </div>
      {viewMode === "calendar" && (
        <Card><CardContent className="p-4 flex justify-center overflow-hidden"><div className="w-full max-w-sm">
          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR} modifiers={{ scheduled: scheduleDates }} modifiersClassNames={{ scheduled: "bg-primary/20 font-bold text-primary" }} className="rounded-md mx-auto" />
        </div></CardContent></Card>
      )}
      {schedules.length === 0 ? (
        <Card><CardContent className="py-8"><p className="text-center text-muted-foreground">Você não está escalado(a) em nenhum evento.</p></CardContent></Card>
      ) : displaySchedules.length === 0 ? (
        <Card><CardContent className="py-8"><p className="text-center text-muted-foreground">Nenhuma escala nesta data.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {displaySchedules.map((s) => {
            const eventDate = s.schedule ? new Date(s.schedule.event_date + "T12:00:00") : null;
            const isPast = eventDate ? eventDate < new Date(new Date().setHours(0,0,0,0)) : false;
            const isExpanded = expandedSchedule === s.schedule_id;
            const vols = coVolunteers[s.schedule_id];
            return (
              <Card key={s.id} className={isPast ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => s.schedule_id && loadCoVolunteers(s.schedule_id)}>
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 flex-shrink-0">
                      <span className="text-xl font-bold text-primary">{eventDate?.getDate() || "?"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{eventDate ? format(eventDate, "MMM", { locale: ptBR }) : ""}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{s.schedule?.event_name || "Evento"}</h4>
                      <p className="text-xs text-muted-foreground">{s.schedule?.ministry?.name || "Ministério"}</p>
                      {s.role && <Badge variant="secondary" className="text-[10px] py-0 h-4 mt-1">{s.role}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.confirmed ? (
                        <Badge variant="default" className="bg-emerald-600"><Check className="w-3 h-3 mr-1" />Confirmado</Badge>
                      ) : !isPast ? (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); onConfirm(s); }}><Check className="w-3 h-3 mr-1" />Confirmar</Button>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Escalados do dia</p>
                        {loadingVols === s.schedule_id ? (
                          <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin" /></div>
                        ) : vols?.volunteers?.length > 0 ? (
                          <div className="space-y-1.5">
                            {(vols.volunteers as CoVolunteer[]).map((v) => (
                              <div key={v.id} className="flex items-center gap-2 text-sm p-1.5 rounded-md bg-muted/50">
                                <Avatar className="w-6 h-6"><AvatarFallback className="text-[10px]">{(v.member?.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium truncate block">{v.member?.full_name || "Membro"}</span>
                                  {v.role && <Badge variant="secondary" className="text-[10px] py-0 h-4 mt-0.5">{v.role}</Badge>}
                                </div>
                                {v.confirmed ? (
                                  <Badge variant="outline" className="text-[10px] py-0 h-5 text-emerald-600 border-emerald-200"><Check className="w-2.5 h-2.5 mr-0.5" />OK</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] py-0 h-5 text-amber-600 border-amber-200">Pendente</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Nenhum voluntário escalado.</p>
                        )}
                      </div>
                      {vols?.songs?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">🎵 Louvores do dia</p>
                          <div className="space-y-1.5">
                            {(vols.songs as any[]).map((ss: any, idx: number) => (
                              <div key={ss.id} className="flex items-center gap-2 text-sm p-1.5 rounded-md bg-muted/50">
                                <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium truncate block">{ss.song?.title || "?"}</span>
                                  <div className="flex items-center gap-1">
                                    {ss.song?.key_signature && <Badge variant="secondary" className="text-[10px] py-0 h-4">{ss.song.key_signature}</Badge>}
                                    {ss.song?.artist && <span className="text-[10px] text-muted-foreground">{ss.song.artist}</span>}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {ss.song?.chord_url && <a href={ss.song.chord_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline">Cifra</a>}
                                  {ss.song?.audio_url && <a href={ss.song.audio_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline">Áudio</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Contribuição View ──────────────────────────────────
function ContribuicaoView({ churchId }: { churchId: string }) {
  const [data, setData] = useState<ContribuicaoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { data: settings } = await supabase.from("church_settings" as any)
        .select("pix_key, pix_key_type, pix_holder_name, bank_name, bank_agency, bank_account, bank_account_type")
        .eq("church_id", churchId).maybeSingle();
      setData(settings as ContribuicaoData | null);
      setIsLoading(false);
    })();
  }, [churchId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Chave Pix copiada." });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!data || (!data.pix_key && !data.bank_name)) {
    return <Card><CardContent className="py-8 text-center"><DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Dados de contribuição ainda não foram configurados.</p></CardContent></Card>;
  }

  const pixTypeLabels: Record<string, string> = { cpf: "CPF", cnpj: "CNPJ", email: "E-mail", telefone: "Telefone", aleatoria: "Chave Aleatória" };

  return (
    <div className="space-y-4">
      {data.pix_key && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" /> Pix</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.pix_key_type && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tipo:</span><span className="font-medium">{pixTypeLabels[data.pix_key_type] || data.pix_key_type}</span></div>}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Chave:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{data.pix_key}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(data.pix_key!)}><Copy className="w-3 h-3" /></Button>
              </div>
            </div>
            {data.pix_holder_name && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Favorecido:</span><span className="font-medium">{data.pix_holder_name}</span></div>}
          </CardContent>
        </Card>
      )}
      {data.bank_name && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Dados Bancários</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[["Banco", data.bank_name], ["Agência", data.bank_agency], ["Conta", data.bank_account], ["Tipo", data.bank_account_type], ["Favorecido", data.pix_holder_name]].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm"><span className="text-muted-foreground">{label}:</span><span className="font-medium">{value}</span></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Campanhas View ──────────────────────────────────
function CampanhasAppView({ churchId }: { churchId: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("financial_campaigns")
        .select("id, name, description, goal_amount, current_amount, start_date, end_date")
        .eq("church_id", churchId).eq("is_active", true).order("created_at", { ascending: false });
      setCampaigns(data || []);
      setLoading(false);
    })();
  }, [churchId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (campaigns.length === 0) {
    return <Card><CardContent className="py-8 text-center"><Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma campanha ativa no momento.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {campaigns.map((c: any) => {
        const progress = c.goal_amount ? Math.min(100, ((c.current_amount || 0) / c.goal_amount) * 100) : 0;
        return (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold">{c.name}</h4>
              {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              {c.goal_amount && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>R$ {Number(c.current_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <span>Meta: R$ {Number(c.goal_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                  <p className="text-xs text-muted-foreground text-right mt-1">{progress.toFixed(0)}%</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Ministries View ──────────────────────────────────
function MinistriesView({ churchId }: { churchId: string }) {
  const [ministries, setMinistries] = useState<MinistryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("ministries")
        .select("id, name, description, leader:members!ministries_leader_id_fkey(full_name)")
        .eq("church_id", churchId).eq("is_active", true).order("name");
      setMinistries((data as any[])?.map(d => ({ ...d, leader: Array.isArray(d.leader) ? d.leader[0] : d.leader })) || []);
      setLoading(false);
    })();
  }, [churchId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (ministries.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum ministério cadastrado.</CardContent></Card>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Ministérios</h3>
      {ministries.map(m => (
        <Card key={m.id}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{m.name}</p>
              {m.description && <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>}
              {m.leader && <p className="text-xs text-primary mt-0.5">Líder: {m.leader.full_name}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Cells View ──────────────────────────────────
function CellsView({ churchId }: { churchId: string }) {
  const [cells, setCells] = useState<CellData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("cells")
        .select("id, name, day_of_week, time, address, network, leader:members!cells_leader_fk(full_name)")
        .eq("church_id", churchId).eq("is_active", true).order("name");
      setCells((data as any[])?.map(d => ({ ...d, leader: Array.isArray(d.leader) ? d.leader[0] : d.leader })) || []);
      setLoading(false);
    })();
  }, [churchId]);

  const dayLabels: Record<string, string> = { segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", domingo: "Domingo" };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (cells.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma célula cadastrada.</CardContent></Card>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Grid3X3 className="w-5 h-5 text-primary" /> Células</h3>
      {cells.map(c => (
        <Card key={c.id}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Grid3X3 className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{c.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {c.day_of_week && <span className="text-xs text-muted-foreground">{dayLabels[c.day_of_week] || c.day_of_week}</span>}
                {c.time && <span className="text-xs text-muted-foreground">• {c.time}</span>}
                {c.network && <Badge variant="outline" className="text-[10px] py-0 h-4">{c.network}</Badge>}
              </div>
              {c.leader && <p className="text-xs text-primary mt-0.5">Líder: {c.leader.full_name}</p>}
              {c.address && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.address}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Igreja View ──────────────────────────────────
function IgrejaView({ churchId, church }: { churchId: string; church: any }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("app_module_configs" as any)
        .select("config").eq("church_id", churchId).eq("module_key", "igreja").maybeSingle();
      setConfig((data as any)?.config || {});
      setLoading(false);
    })();
  }, [churchId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Church className="w-5 h-5 text-primary" /> Nossa Igreja</h3>
      <Card>
        <CardContent className="p-4 space-y-3">
          {church?.logo_url && (
            <div className="flex justify-center">
              <img src={church.logo_url} alt="" className="w-24 h-24 object-contain rounded-xl" style={{ imageRendering: "auto" }} />
            </div>
          )}
          <h4 className="text-lg font-bold text-center">{church?.name || "Igreja"}</h4>
          {config?.pastor_name && (
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pastor:</span><span className="font-medium">{config.pastor_name}</span></div>
          )}
          {(church?.address || config?.address) && (
            <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><span>{config?.address || church.address}</span></div>
          )}
          {(church?.phone || config?.phone) && (
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Telefone:</span><span>{config?.phone || church.phone}</span></div>
          )}
          {(church?.email || config?.email) && (
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Email:</span><span>{config?.email || church.email}</span></div>
          )}
          {config?.schedule && (
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Horários:</span><span>{config.schedule}</span></div>
          )}
          {config?.about && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">{config.about}</p>
            </div>
          )}
          {!config?.pastor_name && !config?.about && !church?.address && (
            <p className="text-center text-muted-foreground text-sm py-4">Informações da igreja ainda não foram configuradas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── YouTube View ──────────────────────────────────
function YoutubeView({ churchId }: { churchId: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("app_module_configs" as any)
        .select("config").eq("church_id", churchId).eq("module_key", "youtube").maybeSingle();
      setConfig((data as any)?.config || {});
      setLoading(false);
    })();
  }, [churchId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Video className="w-5 h-5 text-primary" /> YouTube</h3>
      {config?.channel_url ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <a href={config.channel_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm font-medium">
              Acessar Canal no YouTube →
            </a>
            {config.description && <p className="text-sm text-muted-foreground">{config.description}</p>}
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8"><p className="text-center text-muted-foreground">Canal do YouTube ainda não foi configurado.</p></CardContent></Card>
      )}
    </div>
  );
}

// ─── Redes Sociais View ──────────────────────────────────
function RedesSociaisView({ churchId }: { churchId: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("app_module_configs" as any)
        .select("config").eq("church_id", churchId).eq("module_key", "redes_sociais").maybeSingle();
      setConfig((data as any)?.config || {});
      setLoading(false);
    })();
  }, [churchId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const links = [
    { key: "instagram", label: "Instagram", icon: "📸" },
    { key: "facebook", label: "Facebook", icon: "📘" },
    { key: "tiktok", label: "TikTok", icon: "🎵" },
    { key: "twitter", label: "X (Twitter)", icon: "🐦" },
    { key: "website", label: "Site", icon: "🌐" },
  ];

  const hasAny = links.some(l => config?.[l.key]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Redes Sociais</h3>
      {hasAny ? (
        <div className="space-y-3">
          {links.filter(l => config?.[l.key]).map(l => (
            <Card key={l.key}>
              <CardContent className="p-4">
                <a href={config[l.key]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                  <span className="text-xl">{l.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{l.label}</p>
                    <p className="text-xs text-primary truncate">{config[l.key]}</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-8"><p className="text-center text-muted-foreground">Redes sociais ainda não foram configuradas.</p></CardContent></Card>
      )}
    </div>
  );
}

// ─── Shortcut Button ──────────────────────────────────
function ShortcutButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 py-3">
      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/25 transition-all shadow-lg">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wider leading-tight text-center max-w-[70px]">{label}</span>
    </button>
  );
}

// ─── Main Page ──────────────────────────────────
export default function MeuApp() {
  const { profile, church, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [networkAnnouncements, setNetworkAnnouncements] = useState<NetworkAnnouncement[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [weddingAnniversaries, setWeddingAnniversaries] = useState<WeddingMember[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [schedules, setSchedules] = useState<MySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<string>("home");
  const [heroBgUrl, setHeroBgUrl] = useState<string | null>(null);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroGradient, setHeroGradient] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.church_id) fetchData();
  }, [profile?.church_id]);

  const fetchData = async () => {
    if (!profile?.church_id) return;
    setIsLoading(true);
    try {
      // Fetch hero background from app_module_configs
      const { data: heroBgConfig } = await supabase.from("app_module_configs" as any)
        .select("config").eq("church_id", profile.church_id).eq("module_key", "hero_bg").maybeSingle();
      const heroCfg = (heroBgConfig as any)?.config || {};
      if (heroCfg.bg_url) setHeroBgUrl(heroCfg.bg_url);
      if (heroCfg.video_url) setHeroVideoUrl(heroCfg.video_url);
      if (heroCfg.gradient) setHeroGradient(heroCfg.gradient);

      const { data: announcementsData } = await supabase.from("announcements")
        .select("id, title, content, created_at").eq("church_id", profile.church_id)
        .eq("is_active", true).order("created_at", { ascending: false }).limit(5);
      setAnnouncements((announcementsData as Announcement[]) || []);

      // Load network announcements
      const { data: churchData } = await supabase.from("churches")
        .select("ministry_network_id").eq("id", profile.church_id).maybeSingle();
      if ((churchData as any)?.ministry_network_id) {
        const today = new Date().toISOString().split("T")[0];
        const { data: netAnns } = await supabase.from("network_announcements" as any)
          .select("id, title, content, start_date, end_date, image_url, created_at")
          .eq("network_id", (churchData as any).ministry_network_id)
          .eq("is_active", true)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("created_at", { ascending: false })
          .limit(10);
        setNetworkAnnouncements((netAnns as NetworkAnnouncement[]) || []);
      }

      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
      
      const { data: birthdayData } = await supabase.from("members")
        .select("id, full_name, birth_date, photo_url").eq("church_id", profile.church_id)
        .eq("is_active", true).not("birth_date", "is", null);
      setBirthdays(((birthdayData || []) as BirthdayMember[]).filter(m => m.birth_date?.split("-")[1] === currentMonth)
        .sort((a, b) => parseInt(a.birth_date.split("-")[2]) - parseInt(b.birth_date.split("-")[2])));

      const { data: weddingData } = await supabase.from("members")
        .select("id, full_name, wedding_date, photo_url").eq("church_id", profile.church_id)
        .eq("is_active", true).not("wedding_date", "is", null);
      setWeddingAnniversaries(((weddingData || []) as WeddingMember[]).filter(m => m.wedding_date?.split("-")[1] === currentMonth)
        .sort((a, b) => parseInt(a.wedding_date.split("-")[2]) - parseInt(b.wedding_date.split("-")[2])));

      const today = now.toISOString().split("T")[0];
      const { data: eventsData } = await supabase.from("events")
        .select("id, title, event_date, event_time, location").eq("church_id", profile.church_id)
        .gte("event_date", today).order("event_date", { ascending: true }).limit(5);
      setEvents((eventsData as UpcomingEvent[]) || []);

      // Schedule lookup - try multiple approaches to find member_id
      let memberId = profile.member_id;
      // Fallback 1: use profile email
      const emailToSearch = profile.email || user?.email;
      if (!memberId && emailToSearch) {
        const { data: memberByEmail } = await supabase.from("members").select("id")
          .eq("church_id", profile.church_id!).ilike("email", emailToSearch.trim()).limit(1);
        if (memberByEmail?.length) {
          memberId = memberByEmail[0].id;
          // Auto-link for future lookups
          await supabase.from("profiles").update({ member_id: memberId } as any).eq("user_id", user!.id);
        }
      }
      // Fallback 2: use full_name
      if (!memberId && profile.full_name) {
        const { data: memberByName } = await supabase.from("members").select("id")
          .eq("church_id", profile.church_id!).ilike("full_name", profile.full_name.trim()).limit(1);
        if (memberByName?.length) {
          memberId = memberByName[0].id;
          await supabase.from("profiles").update({ member_id: memberId } as any).eq("user_id", user!.id);
        }
      }

      console.log("[MeuApp] Schedule lookup memberId:", memberId, "profile.member_id:", profile.member_id);

      if (memberId) {
        // Two-step approach to avoid nested join issues
        const { data: svData, error: svError } = await supabase
          .from("schedule_volunteers")
          .select("id, schedule_id, role, confirmed, member_id")
          .eq("member_id", memberId);
        
        console.log("[MeuApp] schedule_volunteers query:", { count: svData?.length, error: svError?.message });

        if (svData?.length) {
          const scheduleIds = [...new Set(svData.map((sv: any) => sv.schedule_id))];
          const { data: schedData } = await supabase
            .from("ministry_schedules")
            .select("id, event_name, event_date, notes, ministry_id")
            .in("id", scheduleIds);

          // Get ministry names
          const ministryIds = [...new Set((schedData || []).map((s: any) => s.ministry_id))];
          const { data: ministriesData } = await supabase
            .from("ministries")
            .select("id, name")
            .in("id", ministryIds)
            .eq("church_id", profile.church_id!);
          
          const ministryMap = new Map((ministriesData || []).map((m: any) => [m.id, m.name]));
          const schedMap = new Map((schedData || []).map((s: any) => [s.id, s]));

          const allSchedules = svData
            .map((sv: any) => {
              const sched = schedMap.get(sv.schedule_id);
              if (!sched || !ministryMap.has(sched.ministry_id)) return null;
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
                  ministry: { name: ministryMap.get(sched.ministry_id) || "Ministério" },
                },
              };
            })
            .filter(Boolean) as MySchedule[];
          
          allSchedules.sort((a, b) => (a.schedule?.event_date || "").localeCompare(b.schedule?.event_date || ""));
          console.log("[MeuApp] Final schedules:", allSchedules.length);
          setSchedules(allSchedules);
        } else { setSchedules([]); }
      } else { 
        console.warn("[MeuApp] Could not find member_id for user. Schedules will be empty.");
        setSchedules([]); 
      }
    } catch (error) {
      console.error("[MeuApp] Error fetching data:", error);
    } finally { setIsLoading(false); }
  };

  const handleConfirmSchedule = async (sv: MySchedule) => {
    try {
      const { error } = await supabase.from("schedule_volunteers").update({ confirmed: true }).eq("id", sv.id);
      if (error) throw error;
      setSchedules(prev => prev.map(s => s.id === sv.id ? { ...s, confirmed: true } : s));
      toast({ title: "Confirmado!", description: `Presença confirmada para "${sv.schedule?.event_name}".` });
    } catch (err: any) {
      toast({ title: "Erro", description: "Não foi possível confirmar.", variant: "destructive" });
    }
  };

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
  const churchId = profile?.church_id;

  const renderContent = () => {
    switch (activeView) {
      case "courses": return <CoursesTab />;
      case "schedules": return <SchedulesView schedules={schedules} onConfirm={handleConfirmSchedule} />;
      case "contribuicao": return churchId ? (
        <>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-primary" /> Doação</h3>
          <ContribuicaoView churchId={churchId} />
          <div className="mt-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Heart className="w-5 h-5 text-primary" /> Campanhas</h3>
            <CampanhasAppView churchId={churchId} />
          </div>
        </>
      ) : null;
      case "ministries": return churchId ? <MinistriesView churchId={churchId} /> : null;
      case "cells": return churchId ? <CellsView churchId={churchId} /> : null;
      case "igreja": return churchId ? <IgrejaView churchId={churchId} church={church} /> : null;
      case "devocional": return churchId ? <DevotionalView churchId={churchId} /> : null;
      case "bible": return <BibleReader />;
      case "youtube": return churchId ? <YoutubeView churchId={churchId} /> : null;
      case "redes-sociais": return churchId ? <RedesSociaisView churchId={churchId} /> : null;
      case "events": return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Eventos</h3>
          {events.length === 0 ? <Card><CardContent className="py-8"><p className="text-center text-muted-foreground">Nenhum evento próximo.</p></CardContent></Card> : (
            <div className="space-y-3">{events.map((evt) => (
              <Card key={evt.id}><CardContent className="p-4">
                <h4 className="font-semibold">{evt.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />{new Date(evt.event_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  {evt.event_time && <span>• {evt.event_time}</span>}
                </div>
                {evt.location && <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{evt.location}</div>}
              </CardContent></Card>
            ))}</div>
          )}
        </div>
      );
      case "prayer": return churchId ? <PrayerRequestView churchId={churchId} /> : null;
      case "profile": return <ProfileEditTab />;
      default: return null;
    }
  };

  // If a sub-view is active, show ONLY that content (full page, no hero)
  if (activeView !== "home") {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setActiveView("home")}>
            ← Voltar
          </Button>
          {renderContent()}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-0">
        {/* Hero Header - Dark immersive design like reference app */}
        <div
          className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-4 pb-6 mb-0 relative overflow-hidden"
          style={{
            background: heroGradient
              ? heroGradient
              : heroBgUrl
                ? `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${heroBgUrl}) center/cover no-repeat`
                : `linear-gradient(135deg, ${church?.primary_color || 'hsl(var(--primary))'} 0%, ${church?.secondary_color || 'hsl(var(--primary) / 0.6)'} 100%)`,
          }}
        >
          {/* Video background */}
          {heroVideoUrl && (
            <video
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
              src={heroVideoUrl}
            />
          )}
          {heroVideoUrl && <div className="absolute inset-0 bg-black/50 z-0" />}
          {/* Subtle overlay pattern */}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Top bar: settings + avatar */}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate("/configuracoes")}>
              <Settings className="w-5 h-5" />
            </Button>
            <button onClick={() => setActiveView("profile")} className="relative">
              <Avatar className="w-9 h-9 border-2 border-white/30">
                <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="text-xs bg-white/15 text-white">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </div>

          {/* Centered Logo - Premium and crisp */}
          <div className="flex flex-col items-center text-center gap-3 relative z-10 py-4">
            {church?.logo_url ? (
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-110" />
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-2 shadow-2xl">
                  <img
                    src={church.logo_url}
                    alt={church.name || "Logo"}
                    className="w-full h-full rounded-2xl object-contain"
                    style={{ imageRendering: "auto" }}
                    loading="eager"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl scale-110" />
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white/10 flex items-center justify-center shadow-2xl backdrop-blur-lg border border-white/20">
                  <Church className="w-16 h-16 text-white/70" />
                </div>
              </div>
            )}
            <div className="mt-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                {(church as any)?.ministry_name || church?.name || "Minha Igreja"}
              </h1>
              {(church as any)?.ministry_name && church?.name && (
                <p className="text-sm text-white/60 mt-0.5">{church.name}</p>
              )}
            </div>
          </div>

          {/* Icon Grid - Row 1 (inside hero) */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-4 relative z-10">
            <ShortcutButton icon={Church} label="Igreja" onClick={() => setActiveView("igreja")} />
            <ShortcutButton icon={Flame} label="Ministérios" onClick={() => setActiveView("ministries")} />
            <ShortcutButton icon={Video} label="Mensagens" onClick={() => setActiveView("youtube")} />
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-1 relative z-10">
            <ShortcutButton icon={HandHeart} label="Doação" onClick={() => setActiveView("contribuicao")} />
            <ShortcutButton icon={BookOpen} label="Devocional" onClick={() => setActiveView("devocional")} />
            <ShortcutButton icon={Grid3X3} label="Células" onClick={() => setActiveView("cells")} />
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-1 relative z-10">
            <ShortcutButton icon={CalendarIcon} label="Eventos" onClick={() => setActiveView("events")} />
            <ShortcutButton icon={Book} label="Bíblia" onClick={() => setActiveView("bible")} />
            <ShortcutButton icon={MessageSquare} label="Oração" onClick={() => setActiveView("prayer")} />
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-1 relative z-10">
            <ShortcutButton icon={GraduationCap} label="Cursos" onClick={() => setActiveView("courses")} />
            <ShortcutButton icon={Clock} label="Escalas" onClick={() => setActiveView("schedules")} />
            <ShortcutButton icon={Users} label="Redes Sociais" onClick={() => setActiveView("redes-sociais")} />
          </div>
        </div>

        {/* Fixed Sections Below */}
        <div className="px-0 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Informes da Rede */}
              {networkAnnouncements.length > 0 && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> Informes da Rede</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {networkAnnouncements.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-card border border-border">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                          )}
                          <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{item.content}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                            {item.start_date && (
                              <span>📅 {new Date(item.start_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                            )}
                            {item.end_date && (
                              <span>→ {new Date(item.end_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                            )}
                            {!item.start_date && (
                              <span>{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Avisos da Igreja */}
              {announcements.length > 0 && (
                <Card className="border-secondary/30 bg-secondary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-secondary" /> Avisos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {announcements.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-card border border-border">
                          <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Escalas pendentes */}
              {schedules.filter(s => !s.confirmed).length > 0 && (
                <Card className="border-amber-300/30 bg-amber-50/50 dark:bg-amber-950/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /> Escalas Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {schedules.filter(s => !s.confirmed).slice(0, 3).map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.schedule?.event_name}</p>
                            <p className="text-xs text-muted-foreground">{s.schedule?.event_date ? new Date(s.schedule.event_date + "T12:00:00").toLocaleDateString("pt-BR") : ""}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleConfirmSchedule(s)}>
                            <Check className="w-3 h-3 mr-1" /> Confirmar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aniversariantes */}
              {birthdays.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Cake className="w-4 h-4 text-secondary" /> Aniversariantes do Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {birthdays.slice(0, 10).map((m) => (
                        <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                          <Avatar className="w-6 h-6"><AvatarImage src={m.photo_url || ""} /><AvatarFallback className="text-[9px] bg-secondary/10 text-secondary">{m.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                          <span className="text-xs font-medium">{m.full_name.split(" ")[0]}</span>
                          <span className="text-[10px] text-muted-foreground">{m.birth_date ? new Date(m.birth_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aniversários de Casamento */}
              {weddingAnniversaries.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-primary" /> Aniversários de Casamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {weddingAnniversaries.slice(0, 10).map((m) => (
                        <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                          <Avatar className="w-6 h-6"><AvatarImage src={m.photo_url || ""} /><AvatarFallback className="text-[9px] bg-primary/10 text-primary">{m.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                          <span className="text-xs font-medium">{m.full_name.split(" ")[0]}</span>
                          <span className="text-[10px] text-muted-foreground">{m.wedding_date ? new Date(m.wedding_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meu Perfil */}
              <Button variant="outline" className="w-full" onClick={() => setActiveView("profile")}>
                <User className="w-4 h-4 mr-2" /> Meu Perfil
              </Button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
