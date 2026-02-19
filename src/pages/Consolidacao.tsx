import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Users,
  UserCheck,
  UserPlus,
  Heart,
  Loader2,
  MoreHorizontal,
  Phone,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConsolidation, ConsolidationRecord } from "@/hooks/useConsolidation";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";

const statusConfig: Record<ConsolidationRecord["status"], { label: string; color: string }> = {
  contato: { label: "Contato Inicial", color: "bg-info/20 text-info" },
  acompanhamento: { label: "Em Acompanhamento", color: "bg-secondary/20 text-secondary" },
  integracao: { label: "Integração", color: "bg-accent/20 text-accent-foreground" },
  concluido: { label: "Concluído", color: "bg-success/20 text-success" },
  desistente: { label: "Desistente", color: "bg-destructive/20 text-destructive" },
};

export default function Consolidacao() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedConsolidatorId, setSelectedConsolidatorId] = useState<string | null>(null);

  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { records, isLoading, stats, createRecord, updateStatus, deleteRecord } = useConsolidation(churchId || undefined);

  const handleAddConsolidation = async () => {
    if (!selectedMemberId) return;
    await createRecord({
      member_id: selectedMemberId,
      consolidator_id: selectedConsolidatorId || undefined,
      status: "contato",
      contact_date: new Date().toISOString().split("T")[0],
    });
    setSelectedMemberId(null);
    setSelectedConsolidatorId(null);
    setShowAddForm(false);
  };

  if (!churchId) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Central de Consolidação</h1>
            <p className="text-muted-foreground">
              Acompanhamento de novos convertidos e visitantes
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Consolidação
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Phone className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.contato}</p>
                  <p className="text-xs text-muted-foreground">Contato</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Heart className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.acompanhamento}</p>
                  <p className="text-xs text-muted-foreground">Acompanhando</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <UserCheck className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.concluido}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.desistente}</p>
                  <p className="text-xs text-muted-foreground">Desistentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nova Consolidação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Novo Convertido/Visitante *</label>
                  <MemberAutocomplete
                    churchId={churchId}
                    value={selectedMemberId || undefined}
                    onChange={setSelectedMemberId}
                    placeholder="Selecione a pessoa..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consolidador</label>
                  <MemberAutocomplete
                    churchId={churchId}
                    value={selectedConsolidatorId || undefined}
                    onChange={setSelectedConsolidatorId}
                    placeholder="Quem vai acompanhar..."
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddConsolidation} disabled={!selectedMemberId}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acompanhamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma consolidação ativa</h3>
                <p className="text-muted-foreground mb-4">
                  Inicie o acompanhamento de novos convertidos.
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Consolidação
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Consolidador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Contato</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {record.member?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{record.member?.full_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {record.member?.phone && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {record.member.phone}
                            </span>
                          )}
                          {record.member?.email && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {record.member.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.consolidator?.full_name || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={record.status}
                          onValueChange={(value: ConsolidationRecord["status"]) =>
                            updateStatus(record.id, value)
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue>
                              <Badge className={statusConfig[record.status].color}>
                                {statusConfig[record.status].label}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {record.contact_date
                          ? new Date(record.contact_date).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteRecord(record.id)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
