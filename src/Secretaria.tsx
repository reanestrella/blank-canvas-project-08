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
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Users,
  UserPlus,
  Heart,
  Droplets,
  Download,
  Loader2,
  Eye,
  UserCheck,
  Baby,
} from "lucide-react";
import { useMembers, CreateMemberData } from "@/hooks/useMembers";
import { MemberModal } from "@/components/modals/MemberModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { CongregationSelector } from "@/components/layout/CongregationSelector";
import { useCongregations } from "@/hooks/useCongregations";
import { useAuth } from "@/contexts/AuthContext";
import type { Member } from "@/hooks/useMembers";

const statusConfig = {
  visitante: { label: "Visitante", color: "bg-muted text-muted-foreground" },
  novo_convertido: { label: "Decidido", color: "bg-success/20 text-success" },
  membro: { label: "Membro", color: "bg-primary/20 text-primary" },
  lider: { label: "Líder", color: "bg-secondary/20 text-secondary" },
  discipulador: { label: "Discipulador", color: "bg-info/20 text-info" },
};

const networkConfig = {
  homens: { label: "Homens", icon: Users, color: "text-primary" },
  mulheres: { label: "Mulheres", icon: UserCheck, color: "text-secondary" },
  jovens: { label: "Jovens", icon: UserPlus, color: "text-info" },
  kids: { label: "Kids", icon: Baby, color: "text-success" },
};

export default function Secretaria() {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { congregations, selectedCongregation, setSelectedCongregation } = useCongregations(churchId || undefined);
  const { members, isLoading, createMember, updateMember, deleteMember } = useMembers(churchId || undefined);

  // Filter members by tab, search, and network
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const matchesSearch = 
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (member.phone?.includes(searchTerm) ?? false);
      
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
      const matchesNetwork = networkFilter === "all" || member.network === networkFilter;

      // Congregation filter
      const matchesCongregation = !selectedCongregation || 
        member.congregation_id === selectedCongregation ||
        !member.congregation_id;

      return matchesSearch && matchesTab && matchesNetwork && matchesCongregation;
    });
  }, [members, searchTerm, activeTab, networkFilter, selectedCongregation]);

  // Stats by type
  const stats = useMemo(() => {
    const activeMembers = members.filter(m => m.is_active);
    return {
      total: activeMembers.length,
      membros: activeMembers.filter(m => 
        m.spiritual_status === "membro" || 
        m.spiritual_status === "lider" || 
        m.spiritual_status === "discipulador"
      ).length,
      decididos: activeMembers.filter(m => m.spiritual_status === "novo_convertido").length,
      visitantes: activeMembers.filter(m => m.spiritual_status === "visitante").length,
      batizados: activeMembers.filter(m => m.baptism_date !== null).length,
      networks: {
        homens: activeMembers.filter(m => m.network === "homens").length,
        mulheres: activeMembers.filter(m => m.network === "mulheres").length,
        jovens: activeMembers.filter(m => m.network === "jovens").length,
        kids: activeMembers.filter(m => m.network === "kids").length,
      }
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
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Secretaria</h1>
            <p className="text-muted-foreground">
              Gerencie membros, decididos e visitantes da sua igreja
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CongregationSelector
              congregations={congregations}
              selectedId={selectedCongregation}
              onSelect={setSelectedCongregation}
            />
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
          </div>
        </div>

        {/* Stats by Type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(stats.networks).map(([network, count]) => {
            const config = networkConfig[network as keyof typeof networkConfig];
            return (
              <button
                key={network}
                onClick={() => setNetworkFilter(networkFilter === network ? "all" : network)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                  networkFilter === network 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <config.icon className={`w-4 h-4 ${config.color}`} />
                <span className="text-sm font-medium">{config.label}</span>
                <Badge variant="secondary" className="ml-auto">{count}</Badge>
              </button>
            );
          })}
        </div>

        {/* Tabs by Person Type */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todos">Todos ({stats.total})</TabsTrigger>
            <TabsTrigger value="membros">Membros ({stats.membros})</TabsTrigger>
            <TabsTrigger value="decididos">Decididos ({stats.decididos})</TabsTrigger>
            <TabsTrigger value="visitantes">Visitantes ({stats.visitantes})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
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
                              <DropdownMenuItem>Ver perfil completo</DropdownMenuItem>
                              <DropdownMenuItem>Histórico espiritual</DropdownMenuItem>
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
        </Tabs>
      </div>

      {/* Member Modal */}
      <MemberModal
        open={memberModalOpen}
        onOpenChange={handleCloseModal}
        member={editingMember}
        onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
        title="Remover Pessoa"
        description={`Tem certeza que deseja remover ${deletingMember?.full_name}? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteMember(deletingMember!.id)}
      />
    </AppLayout>
  );
}
