import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  Phone,
  MessageCircle,
  Eye,
  Check,
  Loader2,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { useCellLeaderTools, CellVisitor, CellLeadershipDevelopment } from "@/hooks/useCellLeaderTools";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import type { Cell } from "@/hooks/useCells";

interface CellLeaderPillarsProps {
  cell: Cell;
  churchId: string;
}

const careTypeLabels = {
  visita: "Visita",
  ligacao: "Ligação",
  mensagem: "Mensagem",
  oracao: "Oração",
  outro: "Outro",
};

const visitorStatusLabels: Record<CellVisitor["follow_up_status"], { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-muted text-muted-foreground" },
  em_acompanhamento: { label: "Acompanhando", color: "bg-secondary/20 text-secondary" },
  integrado: { label: "Integrado", color: "bg-success/20 text-success" },
  desistente: { label: "Desistente", color: "bg-destructive/20 text-destructive" },
};

const leaderLevelLabels: Record<CellLeadershipDevelopment["potential_level"], { label: string; color: string }> = {
  identificado: { label: "Identificado", color: "bg-info/20 text-info" },
  em_treinamento: { label: "Em Treinamento", color: "bg-secondary/20 text-secondary" },
  pronto: { label: "Pronto", color: "bg-success/20 text-success" },
  lancado: { label: "Lançado", color: "bg-primary/20 text-primary" },
};

export function CellLeaderPillars({ cell, churchId }: CellLeaderPillarsProps) {
  const [activeTab, setActiveTab] = useState("oracao");
  const [newPrayer, setNewPrayer] = useState("");
  const [newPrayerMemberId, setNewPrayerMemberId] = useState<string | null>(null);
  const [careMemberId, setCareMemberId] = useState<string | null>(null);
  const [careType, setCareType] = useState<"visita" | "ligacao" | "mensagem" | "oracao" | "outro">("mensagem");
  const [careNotes, setCareNotes] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [leaderMemberId, setLeaderMemberId] = useState<string | null>(null);
  const [leaderNotes, setLeaderNotes] = useState("");

  const {
    prayerRequests,
    pastoralCare,
    visitors,
    leadershipDev,
    isLoading,
    createPrayerRequest,
    togglePrayerAnswered,
    createPastoralCare,
    createVisitor,
    updateVisitorStatus,
    createLeadershipDev,
    updateLeadershipLevel,
  } = useCellLeaderTools(cell.id, churchId);

  const handleAddPrayer = async () => {
    if (!newPrayer.trim()) return;
    await createPrayerRequest({ request: newPrayer, member_id: newPrayerMemberId || undefined });
    setNewPrayer("");
    setNewPrayerMemberId(null);
  };

  const handleAddCare = async () => {
    if (!careMemberId) return;
    await createPastoralCare({ member_id: careMemberId, care_type: careType, notes: careNotes || undefined });
    setCareMemberId(null);
    setCareNotes("");
  };

  const handleAddVisitor = async () => {
    if (!visitorName.trim()) return;
    await createVisitor({ full_name: visitorName, phone: visitorPhone || undefined });
    setVisitorName("");
    setVisitorPhone("");
  };

  const handleAddLeader = async () => {
    if (!leaderMemberId) return;
    await createLeadershipDev({ member_id: leaderMemberId, notes: leaderNotes || undefined });
    setLeaderMemberId(null);
    setLeaderNotes("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ferramentas do Líder - {cell.name}</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="oracao" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Oração</span>
          </TabsTrigger>
          <TabsTrigger value="cuidado" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden md:inline">Cuidado</span>
          </TabsTrigger>
          <TabsTrigger value="evangelismo" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Evangelismo</span>
          </TabsTrigger>
          <TabsTrigger value="formacao" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden md:inline">Formação</span>
          </TabsTrigger>
        </TabsList>

        {/* ORAÇÃO */}
        <TabsContent value="oracao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Pedidos de Oração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Novo pedido de oração..."
                    value={newPrayer}
                    onChange={(e) => setNewPrayer(e.target.value)}
                  />
                </div>
                <MemberAutocomplete
                  churchId={churchId}
                  value={newPrayerMemberId || undefined}
                  onChange={setNewPrayerMemberId}
                  placeholder="Membro (opcional)"
                  className="md:w-48"
                />
                <Button onClick={handleAddPrayer} disabled={!newPrayer.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {prayerRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum pedido de oração registrado.
                  </p>
                ) : (
                  prayerRequests.map((prayer) => (
                    <div
                      key={prayer.id}
                      className={`p-3 rounded-lg border ${prayer.is_answered ? "bg-success/5 border-success/20" : "bg-muted/30"}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={prayer.is_answered}
                          onCheckedChange={(checked) => togglePrayerAnswered(prayer.id, !!checked)}
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${prayer.is_answered ? "line-through text-muted-foreground" : ""}`}>
                            {prayer.request}
                          </p>
                          {prayer.member && (
                            <p className="text-xs text-muted-foreground mt-1">
                              — {prayer.member.full_name}
                            </p>
                          )}
                        </div>
                        {prayer.is_answered && (
                          <Badge variant="secondary" className="bg-success/20 text-success">
                            <Check className="w-3 h-3 mr-1" />
                            Respondida
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUIDADO */}
        <TabsContent value="cuidado" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-secondary" />
                Cuidado Pastoral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <MemberAutocomplete
                  churchId={churchId}
                  value={careMemberId || undefined}
                  onChange={setCareMemberId}
                  placeholder="Selecione o membro..."
                />
                <Select value={careType} onValueChange={(v) => setCareType(v as typeof careType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(careTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Observação..."
                  value={careNotes}
                  onChange={(e) => setCareNotes(e.target.value)}
                />
                <Button onClick={handleAddCare} disabled={!careMemberId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar
                </Button>
              </div>

              <div className="space-y-2">
                {pastoralCare.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum registro de cuidado.
                  </p>
                ) : (
                  pastoralCare.slice(0, 10).map((care) => (
                    <div key={care.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        {care.care_type === "ligacao" && <Phone className="w-4 h-4 text-secondary" />}
                        {care.care_type === "mensagem" && <MessageCircle className="w-4 h-4 text-secondary" />}
                        {care.care_type === "visita" && <Eye className="w-4 h-4 text-secondary" />}
                        {care.care_type === "oracao" && <BookOpen className="w-4 h-4 text-secondary" />}
                        {care.care_type === "outro" && <Heart className="w-4 h-4 text-secondary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{care.member?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {careTypeLabels[care.care_type]} - {new Date(care.care_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {care.notes && <span className="text-xs text-muted-foreground">{care.notes}</span>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVANGELISMO */}
        <TabsContent value="evangelismo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-info" />
                Visitantes & Evangelismo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Nome do visitante..."
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                />
                <Input
                  placeholder="Telefone..."
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                />
                <Button onClick={handleAddVisitor} disabled={!visitorName.trim()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {visitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum visitante registrado.
                  </p>
                ) : (
                  visitors.map((visitor) => (
                    <div key={visitor.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-info/10 text-info">
                          {visitor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{visitor.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {visitor.phone || "Sem telefone"} • {new Date(visitor.visit_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Select
                        value={visitor.follow_up_status}
                        onValueChange={(v: CellVisitor["follow_up_status"]) => updateVisitorStatus(visitor.id, v)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <Badge className={visitorStatusLabels[visitor.follow_up_status].color}>
                              {visitorStatusLabels[visitor.follow_up_status].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(visitorStatusLabels).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {visitor.accepted_christ && (
                        <Badge className="bg-success/20 text-success">Decisão ✝</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMAÇÃO */}
        <TabsContent value="formacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Formação de Novos Líderes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <MemberAutocomplete
                  churchId={churchId}
                  value={leaderMemberId || undefined}
                  onChange={setLeaderMemberId}
                  placeholder="Membro com potencial..."
                />
                <Textarea
                  placeholder="Observações sobre o desenvolvimento..."
                  value={leaderNotes}
                  onChange={(e) => setLeaderNotes(e.target.value)}
                  className="resize-none"
                  rows={1}
                />
                <Button onClick={handleAddLeader} disabled={!leaderMemberId}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Identificar
                </Button>
              </div>

              <div className="space-y-2">
                {leadershipDev.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum líder em formação identificado.
                  </p>
                ) : (
                  leadershipDev.map((leader) => (
                    <div key={leader.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {leader.member?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{leader.member?.full_name}</p>
                        {leader.notes && (
                          <p className="text-xs text-muted-foreground">{leader.notes}</p>
                        )}
                      </div>
                      <Select
                        value={leader.potential_level}
                        onValueChange={(v: CellLeadershipDevelopment["potential_level"]) =>
                          updateLeadershipLevel(leader.id, v)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <Badge className={leaderLevelLabels[leader.potential_level].color}>
                              {leaderLevelLabels[leader.potential_level].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(leaderLevelLabels).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
