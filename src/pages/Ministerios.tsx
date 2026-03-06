import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart, Music, Baby, Users, Megaphone, Handshake,
  Plus, Calendar, MoreHorizontal, Loader2, Tv, Church,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMinistries, CreateMinistryData } from "@/hooks/useMinistries";
import { useMembers } from "@/hooks/useMembers";
import { useMinistrySchedules } from "@/hooks/useMinistrySchedules";
import { MinistryModal } from "@/components/modals/MinistryModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { VolunteersModal } from "@/components/modals/VolunteersModal";
import { ScheduleModal } from "@/components/modals/ScheduleModal";
import { MinistryCalendar } from "@/components/ministry/MinistryCalendar";
import { MinistryRolesSection } from "@/components/ministry/MinistryRolesSection";
import { WorshipRepertoire } from "@/components/worship/WorshipRepertoire";
import { WorshipSetlist } from "@/components/worship/WorshipSetlist";
import { WorshipDashboard } from "@/components/worship/WorshipDashboard";
import { KidsStudiesSection } from "@/components/ministry/KidsStudiesSection";
import { useAuth } from "@/contexts/AuthContext";
import type { Ministry } from "@/hooks/useMinistries";

const iconMap: Record<string, any> = {
  music: Music, louvor: Music, baby: Baby, kids: Baby,
  handshake: Handshake, diaconal: Handshake, heart: Heart,
  megaphone: Megaphone, users: Users, tv: Tv, midia: Tv,
  church: Church, ministerio: Church,
};

const getMinistryIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) return Icon;
  }
  return Users;
};

export default function Ministerios() {
  const [ministryModalOpen, setMinistryModalOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | undefined>();
  const [deletingMinistry, setDeletingMinistry] = useState<Ministry | null>(null);
  const [volunteersMinistry, setVolunteersMinistry] = useState<Ministry | null>(null);
  const [scheduleMinistry, setScheduleMinistry] = useState<Ministry | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);

  const { profile, hasRole, isAdmin } = useAuth();
  const churchId = profile?.church_id;
  const memberId = profile?.member_id;

  const canCreateMinistry = isAdmin();
  const isLeaderOnly = hasRole("lider_ministerio") && !isAdmin();

  const { ministries: allMinistries, isLoading, createMinistry, updateMinistry, deleteMinistry } = useMinistries(churchId || undefined);
  const { members } = useMembers(churchId || undefined);
  const { schedules: allSchedules } = useMinistrySchedules();

  // Filter ministries: leaders only see theirs
  const ministries = useMemo(() => {
    if (!isLeaderOnly || !memberId) return allMinistries;
    return allMinistries.filter(m => m.leader_id === memberId);
  }, [allMinistries, isLeaderOnly, memberId]);

  const ministryNames = useMemo(() => {
    const map: Record<string, string> = {};
    ministries.forEach(m => { map[m.id] = m.name; });
    return map;
  }, [ministries]);

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return "Sem líder";
    return members.find(m => m.id === memberId)?.full_name || "Desconhecido";
  };

  const handleCreateMinistry = async (data: Partial<Ministry>) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    const createData: CreateMinistryData & { church_id: string } = {
      name: data.name || "",
      description: data.description || undefined,
      leader_id: data.leader_id || undefined,
      church_id: churchId,
    };
    return createMinistry(createData);
  };

  const handleUpdateMinistry = async (data: Partial<Ministry>) => {
    if (!editingMinistry) return { data: null, error: new Error("No ministry to edit") };
    return updateMinistry(editingMinistry.id, data);
  };

  const handleOpenEdit = (ministry: Ministry) => {
    setEditingMinistry(ministry);
    setMinistryModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setMinistryModalOpen(open);
    if (!open) setEditingMinistry(undefined);
  };

  const stats = [
    { label: "Ministérios Ativos", value: ministries.filter(m => m.is_active).length },
    { label: "Total de Ministérios", value: ministries.length },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Ministérios</h1>
            <p className="text-muted-foreground">Gerencie os ministérios e escalas de serviço</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCalendarOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" />Ver Escalas
            </Button>
            {canCreateMinistry && (
              <Button
                className="gradient-accent text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={() => { setEditingMinistry(undefined); setMinistryModalOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-2" />Novo Ministério
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="stat-card">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        {selectedMinistry ? (() => {
          const isWorshipMinistry = selectedMinistry.name.toLowerCase().includes("louvor") || selectedMinistry.name.toLowerCase().includes("worship") || selectedMinistry.name.toLowerCase().includes("music");
          const isKidsMinistry = selectedMinistry.name.toLowerCase().includes("kids") || selectedMinistry.name.toLowerCase().includes("infantil") || selectedMinistry.name.toLowerCase().includes("criança") || selectedMinistry.name.toLowerCase().includes("crianças");
          const canEditMinistry = canCreateMinistry || (isLeaderOnly && selectedMinistry.leader_id === memberId);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setSelectedMinistry(null)}>← Voltar</Button>
                <h2 className="text-xl font-semibold">{selectedMinistry.name}</h2>
              </div>
              <Tabs defaultValue="roles">
                <TabsList className="flex-wrap h-auto gap-1">
                  <TabsTrigger value="roles">Funções</TabsTrigger>
                  <TabsTrigger value="schedule">Escalas</TabsTrigger>
                  <TabsTrigger value="volunteers">Voluntários</TabsTrigger>
                  {isWorshipMinistry && (
                    <>
                      <TabsTrigger value="repertoire">🎵 Repertório</TabsTrigger>
                      <TabsTrigger value="setlist">📋 Setlists</TabsTrigger>
                      <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
                    </>
                  )}
                </TabsList>
                <TabsContent value="roles" className="mt-4">
                  <MinistryRolesSection
                    ministryId={selectedMinistry.id}
                    churchId={churchId!}
                    members={members}
                    canEdit={canEditMinistry}
                  />
                </TabsContent>
                <TabsContent value="schedule" className="mt-4">
                  <ScheduleModal
                    open={true}
                    onOpenChange={() => setSelectedMinistry(null)}
                    ministryId={selectedMinistry.id}
                    ministryName={selectedMinistry.name}
                  />
                </TabsContent>
                <TabsContent value="volunteers" className="mt-4">
                  <VolunteersModal
                    open={true}
                    onOpenChange={() => setSelectedMinistry(null)}
                    ministryId={selectedMinistry.id}
                    ministryName={selectedMinistry.name}
                    members={members}
                  />
                </TabsContent>
                {isWorshipMinistry && (
                  <>
                    <TabsContent value="repertoire" className="mt-4">
                      <WorshipRepertoire churchId={churchId!} canEdit={canEditMinistry} />
                    </TabsContent>
                    <TabsContent value="setlist" className="mt-4">
                      <WorshipSetlist
                        churchId={churchId!}
                        ministryId={selectedMinistry.id}
                        canEdit={canEditMinistry}
                        memberId={memberId || undefined}
                      />
                    </TabsContent>
                    <TabsContent value="dashboard" className="mt-4">
                      <WorshipDashboard churchId={churchId!} />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          );
        })() : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {isLeaderOnly ? "Meus Ministérios" : "Todos os Ministérios"}
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : ministries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum ministério</h3>
                  <p className="text-muted-foreground mb-4">
                    {isLeaderOnly ? "Você não está designado como líder de nenhum ministério." : "Comece criando o primeiro ministério."}
                  </p>
                  {canCreateMinistry && (
                    <Button onClick={() => setMinistryModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />Criar Ministério
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ministries.map(ministry => {
                  const IconComponent = getMinistryIcon(ministry.name);
                  return (
                    <Card
                      key={ministry.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedMinistry(ministry)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          {canCreateMinistry && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="-mr-2">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); handleOpenEdit(ministry); }}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); setScheduleMinistry(ministry); }}>Gerenciar escala</DropdownMenuItem>
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); setVolunteersMinistry(ministry); }}>Voluntários</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); setDeletingMinistry(ministry); }}>Remover</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{ministry.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{ministry.description || "Sem descrição"}</p>
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Líder:</span>
                            <span className="font-medium">{getMemberName(ministry.leader_id)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={ministry.is_active ? "default" : "secondary"}>
                              {ministry.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ministry Modal - only for admins */}
      {canCreateMinistry && (
        <MinistryModal
          open={ministryModalOpen}
          onOpenChange={handleCloseModal}
          ministry={editingMinistry}
          members={members}
          onSubmit={editingMinistry ? handleUpdateMinistry : handleCreateMinistry}
        />
      )}

      <DeleteConfirmModal
        open={!!deletingMinistry}
        onOpenChange={open => !open && setDeletingMinistry(null)}
        title="Excluir Ministério"
        description={`Tem certeza que deseja excluir "${deletingMinistry?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteMinistry(deletingMinistry!.id)}
      />

      {/* Standalone modals for dropdown actions */}
      <VolunteersModal
        open={!!volunteersMinistry}
        onOpenChange={open => !open && setVolunteersMinistry(null)}
        ministryId={volunteersMinistry?.id || ""}
        ministryName={volunteersMinistry?.name || ""}
        members={members}
      />

      <ScheduleModal
        open={!!scheduleMinistry}
        onOpenChange={open => !open && setScheduleMinistry(null)}
        ministryId={scheduleMinistry?.id || ""}
        ministryName={scheduleMinistry?.name || ""}
      />

      <MinistryCalendar
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        schedules={allSchedules}
        ministryNames={ministryNames}
      />
    </AppLayout>
  );
}
