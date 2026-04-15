import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Plus, Filter, MoreHorizontal, Users, UserPlus, Heart,
  Droplets, Download, Loader2, Eye, UserCheck, Baby, Upload, Smartphone,
} from "lucide-react";
import { useAppUsersCount } from "@/hooks/useAppUsersCount";
import { useMembers, CreateMemberData } from "@/hooks/useMembers";
import { MemberModal } from "@/components/modals/MemberModal";
import { MemberImportModal } from "@/components/secretaria/MemberImportModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { CongregationSelector } from "@/components/layout/CongregationSelector";
import { useCongregations } from "@/hooks/useCongregations";
import { useAuth } from "@/contexts/AuthContext";
import type { Member } from "@/hooks/useMembers";
import { RegistrationQrCode } from "@/components/shared/RegistrationQrCode";
import { PendingUsersTab } from "@/components/secretaria/PendingUsersTab";
import { AppUsersTab } from "@/components/secretaria/AppUsersTab";
import { FinancialFilters, PeriodMode } from "@/components/financial/FinancialFilters";

const statusConfig = {
  visitante: { label: "Visitante", color: "bg-muted text-muted-foreground" },
  novo_convertido: { label: "Decidido", color: "bg-success/20 text-success" },
  membro: { label: "Membro", color: "bg-primary/20 text-primary" },
  lider: { label: "Líder", color: "bg-secondary/20 text-secondary" },
  discipulador: { label: "Discipulador", color: "bg-info/20 text-info" },
};

const networkConfig: Record<string, { label: string; icon: any; color: string }> = {
  homens: { label: "Homens", icon: Users, color: "text-primary" },
  mulheres: { label: "Mulheres", icon: UserCheck, color: "text-secondary" },
  jovens: { label: "Jovens", icon: UserPlus, color: "text-info" },
  kids: { label: "Kids", icon: Baby, color: "text-success" },
};

export default function Secretaria() {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  
  const now = new Date();
  const [periodMode, setPeriodMode] = useState<"month" | "year" | "all">("all");
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { congregations, selectedCongregation, setSelectedCongregation } = useCongregations(churchId || undefined);
  const { members, isLoading, createMember, updateMember, deleteMember, fetchMembers } = useMembers(churchId || undefined);
  const { count: appUsersCount } = useAppUsersCount(churchId);

  // Filter members by tab, search, network, period, and active status
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const matchesSearch = 
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (member.phone?.includes(searchTerm) ?? false);
      
      // Inactive tab shows only inactive
      if (activeTab === "inativos") {
        return matchesSearch && !member.is_active;
      }

      // All other tabs only show active
      if (!member.is_active) return false;

      // Period filter
      let matchesPeriod = true;
      if (periodMode !== "all") {
        const d = new Date(member.created_at || "");
        if (periodMode === "year") matchesPeriod = d.getFullYear() === filterYear;
        else matchesPeriod = d.getFullYear() === filterYear && d.getMonth() === filterMonth;
      }

      // Tab filter (by spiritual status)
      let matchesTab = true;
      if (activeTab === "membros") {
        matchesTab = member.spiritual_status === "membro" || 
                     member.spiritual_status === "lider" || 
                     member.spiritual_status === "discipulador";
      } else if (activeTab === "decididos") {
        matchesTab = member.spiritual_status === "novo_convertido";
      } else if (activeTab === "visitantes") {
        matchesTab = member.spiritual_status === "visitante";
      }

      // Network filter
      const matchesNetwork = networkFilter === "all" || (networkFilter === "__none" ? !member.network : member.network === networkFilter);

      // Congregation filter
      const matchesCongregation = !selectedCongregation || 
        member.congregation_id === selectedCongregation ||
        !member.congregation_id;

      return matchesSearch && matchesTab && matchesNetwork && matchesCongregation && matchesPeriod;
    });
  }, [members, searchTerm, activeTab, networkFilter, selectedCongregation, periodMode, filterMonth, filterYear]);

  // Stats by type
  const stats = useMemo(() => {
    const activeMembers = members.filter(m => m.is_active);
    
    // Build dynamic network counts - kids count ALL active, others count membros only
    const membrosForNetwork = activeMembers.filter(m =>
      m.spiritual_status === "membro" || 
      m.spiritual_status === "lider" || 
      m.spiritual_status === "discipulador"
    );
    const networkCounts: Record<string, number> = {};
    // Count kids from ALL active members (regardless of spiritual_status)
    const kidsCount = activeMembers.filter(m => m.network === "kids").length;
    if (kidsCount > 0) networkCounts["kids"] = kidsCount;
    // Count other networks from membros only
    membrosForNetwork.forEach(m => {
      if (m.network && m.network !== "kids") {
        networkCounts[m.network] = (networkCounts[m.network] || 0) + 1;
      }
    });
    // Also count members without a network
    const withoutNetwork = membrosForNetwork.filter(m => !m.network).length;
    
    return {
      total: activeMembers.length,
      membros: activeMembers.filter(m => 
        m.spiritual_status === "membro" || 
        m.spiritual_status === "lider" || 
        m.spiritual_status === "discipulador"
      ).length,
      decididos: activeMembers.filter(m => m.spiritual_status === "novo_convertido").length,
      visitantes: activeMembers.filter(m => m.spiritual_status === "visitante").length,
      batizados: activeMembers.filter(m => (m as any).is_baptized === true || m.baptism_date !== null).length,
      inativos: members.filter(m => !m.is_active).length,
      networks: networkCounts,
      withoutNetwork,
    };
  }, [members]);

  const handleCreateMember = async (data: CreateMemberData) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    return createMember({ 
      ...data, 
      church_id: churchId,
      congregation_id: selectedCongregation || undefined,
    });
  };

  const handleUpdateMember = async (data: CreateMemberData) => {
    if (!editingMember) return { data: null, error: new Error("No member to edit") };
    return updateMember(editingMember.id, data);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setMemberModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setMemberModalOpen(open);
    if (!open) {
      setEditingMember(undefined);
    }
  };

  return (
    <AppLayout requireChurch>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Secretaria</h1>
            <p className="text-muted-foreground">
              Gerencie membros, decididos e visitantes da sua igreja
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              className="gradient-accent text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                setEditingMember(undefined);
                setMemberModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cadastro
            </Button>
            <RegistrationQrCode compact churchId={churchId} congregations={congregations} />
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <FinancialFilters mode={periodMode} month={filterMonth} year={filterYear} onModeChange={(m) => setPeriodMode(m)} onMonthChange={setFilterMonth} onYearChange={setFilterYear} />
            <CongregationSelector
              congregations={congregations}
              selectedId={selectedCongregation}
              onSelect={setSelectedCongregation}
            />
          </div>
        </div>

        {/* Stats by Type */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.membros}</p>
                <p className="text-sm text-muted-foreground">Membros</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.decididos}</p>
                <p className="text-sm text-muted-foreground">Decididos</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.visitantes}</p>
                <p className="text-sm text-muted-foreground">Visitantes</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.batizados}</p>
                <p className="text-sm text-muted-foreground">Batizados</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appUsersCount}</p>
                <p className="text-sm text-muted-foreground">App instalado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(stats.networks).map(([network, count]) => {
            const config = networkConfig[network] || { label: network.charAt(0).toUpperCase() + network.slice(1), icon: Users, color: "text-muted-foreground" };
            return (
              <button
                key={network}
                onClick={() => setNetworkFilter(networkFilter === network ? "all" : network)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all min-w-0 ${
                  networkFilter === network 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <config.icon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                <span className="text-sm font-medium truncate">{config.label}</span>
                <Badge variant="secondary" className="ml-auto flex-shrink-0">{count}</Badge>
              </button>
            );
          })}
          {stats.withoutNetwork > 0 && (
            <button
              onClick={() => setNetworkFilter(networkFilter === "__none" ? "all" : "__none")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all min-w-0 ${
                networkFilter === "__none" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">Sem rede</span>
              <Badge variant="secondary" className="ml-auto flex-shrink-0">{stats.withoutNetwork}</Badge>
            </button>
          )}
        </div>

        {/* Tabs by Person Type */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="todos">Todos ({stats.total})</TabsTrigger>
            <TabsTrigger value="membros">Membros ({stats.membros})</TabsTrigger>
            <TabsTrigger value="decididos">Decididos ({stats.decididos})</TabsTrigger>
            <TabsTrigger value="visitantes">Visitantes ({stats.visitantes})</TabsTrigger>
            <TabsTrigger value="inativos">Inativos ({stats.inativos})</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários do App</TabsTrigger>
          </TabsList>

          {["todos", "membros", "decididos", "visitantes", "inativos"].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {/* Table Card */}
              <div className="card-elevated">
                {/* Table Header */}
                <div className="p-4 border-b flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {networkFilter !== "all" && (
                      <Button variant="ghost" size="sm" onClick={() => setNetworkFilter("all")}>
                        Limpar filtro
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {/* Table */}
                {isLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma pessoa encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || networkFilter !== "all" 
                        ? "Tente ajustar os filtros." 
                        : "Comece cadastrando a primeira pessoa."}
                    </p>
                    {!searchTerm && networkFilter === "all" && (
                      <Button onClick={() => setMemberModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Cadastrar
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pessoa</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="hidden md:table-cell">Rede</TableHead>
                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id} className={`hover:bg-muted/50 ${!member.is_active ? "opacity-50" : ""}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.photo_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.full_name}</p>
                                <p className="text-sm text-muted-foreground md:hidden">
                                  {member.phone || member.email || "-"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <p className="text-sm">{member.email || "-"}</p>
                              <p className="text-sm text-muted-foreground">{member.phone || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={statusConfig[member.spiritual_status]?.color || ""}
                            >
                              {statusConfig[member.spiritual_status]?.label || member.spiritual_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {member.network ? (
                              <Badge variant="outline">
                                {networkConfig[member.network as keyof typeof networkConfig]?.label || member.network}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {member.baptism_date ? (
                              <Badge variant="outline" className="bg-info/10 text-info border-info/30">
                                Batizado
                              </Badge>
                            ) : (
                              <Badge variant="outline">Não batizado</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  handleOpenEdit(member);
                                }}>
                                  Ver perfil completo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  const newStatus = member.is_active ? false : true;
                                  updateMember(member.id, { is_active: newStatus } as any);
                                }}>
                                  {member.is_active ? "Tornar Inativo" : "Reativar"}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeletingMember(member)}
                                >
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination placeholder */}
                {filteredMembers.length > 0 && (
                  <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <span>Mostrando {filteredMembers.length} de {members.length} pessoas</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Anterior
                      </Button>
                      <Button variant="outline" size="sm">
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="pendentes" className="mt-4">
            {churchId && <PendingUsersTab churchId={churchId} />}
          </TabsContent>

          <TabsContent value="usuarios" className="mt-4">
            {churchId && <AppUsersTab churchId={churchId} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Member Modal */}
      <MemberModal
        open={memberModalOpen}
        onOpenChange={handleCloseModal}
        member={editingMember}
        onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
        selectedCongregationId={selectedCongregation}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
        title="Remover Pessoa"
        description={`Tem certeza que deseja remover ${deletingMember?.full_name}? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteMember(deletingMember!.id)}
      />

      {/* Import Modal */}
      {churchId && (
        <MemberImportModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          churchId={churchId}
          existingMembers={members.map(m => ({ full_name: m.full_name, email: m.email, phone: m.phone }))}
          onImportDone={fetchMembers}
        />
      )}

    </AppLayout>
  );
}
