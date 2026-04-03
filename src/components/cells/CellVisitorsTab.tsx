import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, UserPlus, Loader2, Eye, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Cell } from "@/hooks/useCells";

interface CellVisitorRecord {
  id: string;
  cell_id: string;
  church_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  visit_date: string;
  accepted_christ: boolean;
  follow_up_status: string;
  notes: string | null;
  created_at: string;
}

interface GroupedVisitor {
  full_name: string;
  phone: string | null;
  cell_id: string;
  visit_count: number;
  last_visit_date: string;
  first_visit_date: string;
  accepted_christ: boolean;
  follow_up_status: string;
  latest_id: string;
}

interface CellVisitorsTabProps {
  cells: Cell[];
  churchId: string;
}

export function CellVisitorsTab({ cells, churchId }: CellVisitorsTabProps) {
  const [visitors, setVisitors] = useState<CellVisitorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCellFilter, setSelectedCellFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVisitor, setNewVisitor] = useState({ full_name: "", phone: "", cell_id: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchVisitors = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cell_visitors")
      .select("*")
      .eq("church_id", churchId)
      .order("visit_date", { ascending: false })
      .limit(2000);
    if (!error) setVisitors((data as CellVisitorRecord[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (churchId) fetchVisitors();
  }, [churchId]);

  // Group visitors by name+cell to get unique visitors with visit counts
  const groupedVisitors = useMemo(() => {
    const filtered = selectedCellFilter === "all"
      ? visitors
      : visitors.filter(v => v.cell_id === selectedCellFilter);

    const groups = new Map<string, GroupedVisitor>();
    
    for (const v of filtered) {
      const key = `${v.full_name.toLowerCase().trim()}|${v.cell_id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.visit_count += 1;
        if (v.visit_date > existing.last_visit_date) {
          existing.last_visit_date = v.visit_date;
          existing.latest_id = v.id;
          existing.follow_up_status = v.follow_up_status;
          existing.accepted_christ = v.accepted_christ || existing.accepted_christ;
          existing.phone = v.phone || existing.phone;
        }
        if (v.visit_date < existing.first_visit_date) {
          existing.first_visit_date = v.visit_date;
        }
      } else {
        groups.set(key, {
          full_name: v.full_name,
          phone: v.phone,
          cell_id: v.cell_id,
          visit_count: 1,
          last_visit_date: v.visit_date,
          first_visit_date: v.visit_date,
          accepted_christ: v.accepted_christ,
          follow_up_status: v.follow_up_status,
          latest_id: v.id,
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => 
      b.last_visit_date.localeCompare(a.last_visit_date)
    );
  }, [visitors, selectedCellFilter]);

  const handleAddVisitor = async () => {
    if (!newVisitor.full_name.trim() || !newVisitor.cell_id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("cell_visitors").insert([{
        full_name: newVisitor.full_name.trim(),
        phone: newVisitor.phone || null,
        cell_id: newVisitor.cell_id,
        church_id: churchId,
        visit_date: new Date().toISOString().split("T")[0],
      }]);
      if (error) throw error;
      toast({ title: "Visitante cadastrado!" });
      setNewVisitor({ full_name: "", phone: "", cell_id: "" });
      setShowAddForm(false);
      fetchVisitors();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Visit count is now calculated automatically from cell_visitors records

  const getCellName = (cellId: string) => cells.find(c => c.id === cellId)?.name || "—";

  const statusLabels: Record<string, { label: string; color: string }> = {
    pendente: { label: "Pendente", color: "bg-muted text-muted-foreground" },
    em_acompanhamento: { label: "Acompanhando", color: "bg-secondary/20 text-secondary" },
    integrado: { label: "Integrado", color: "bg-success/20 text-success" },
    desistente: { label: "Desistente", color: "bg-destructive/20 text-destructive" },
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("cell_visitors").update({ follow_up_status: status }).eq("id", id);
    fetchVisitors();
  };

  const uniqueVisitorNames = new Set(visitors.map(v => `${v.full_name.toLowerCase().trim()}|${v.cell_id}`));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{visitors.length}</p>
            <p className="text-xs text-muted-foreground">Total de Visitas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{uniqueVisitorNames.size}</p>
            <p className="text-xs text-muted-foreground">Visitantes Únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{visitors.filter(v => v.accepted_christ).length}</p>
            <p className="text-xs text-muted-foreground">Aceitaram Cristo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{visitors.filter(v => v.follow_up_status === "integrado").length}</p>
            <p className="text-xs text-muted-foreground">Integrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedCellFilter} onValueChange={setSelectedCellFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as células" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as células</SelectItem>
            {cells.filter(c => c.is_active).map(cell => (
              <SelectItem key={cell.id} value={cell.id}>{cell.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />Cadastrar Visitante
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Nome do visitante *"
                value={newVisitor.full_name}
                onChange={e => setNewVisitor(prev => ({ ...prev, full_name: e.target.value }))}
              />
              <Input
                placeholder="Telefone"
                value={newVisitor.phone}
                onChange={e => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Select value={newVisitor.cell_id} onValueChange={v => setNewVisitor(prev => ({ ...prev, cell_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a célula *" />
                </SelectTrigger>
                <SelectContent>
                  {cells.filter(c => c.is_active).map(cell => (
                    <SelectItem key={cell.id} value={cell.id}>{cell.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddVisitor} disabled={isSubmitting || !newVisitor.full_name.trim() || !newVisitor.cell_id}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Cadastrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visitors Table - grouped by unique visitor */}
      <Card>
        <CardContent className="p-0">
          {groupedVisitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Eye className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum visitante cadastrado</h3>
              <p className="text-sm text-muted-foreground">Cadastre visitantes das células para acompanhar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead className="hidden md:table-cell">Célula</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Última Visita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedVisitors.map(visitor => {
                  const st = statusLabels[visitor.follow_up_status] || statusLabels.pendente;
                  return (
                    <TableRow key={visitor.latest_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                              {visitor.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{visitor.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{getCellName(visitor.cell_id)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {visitor.phone ? (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{visitor.phone}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-bold ${visitor.visit_count >= 3 ? "bg-success/10 text-success border-success/30" : ""}`}>
                          {visitor.visit_count}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={visitor.follow_up_status} onValueChange={v => updateStatus(visitor.latest_id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_acompanhamento">Acompanhando</SelectItem>
                            <SelectItem value="integrado">Integrado</SelectItem>
                            <SelectItem value="desistente">Desistente</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {new Date(visitor.last_visit_date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Registrar retorno"
                          disabled={isSubmitting}
                          onClick={() => handleRegisterReturnVisit(visitor)}
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
