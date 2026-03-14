import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Loader2, Trash2, Edit2 } from "lucide-react";
import { useChurchAssets, type CreateAssetData, type ChurchAsset } from "@/hooks/useChurchAssets";

const CATEGORIES = [
  "Mobiliário", "Som e Mídia", "Instrumentos", "Informática",
  "Cozinha", "Decoração", "Veículos", "Outros",
];

const CONDITIONS = [
  { value: "novo", label: "Novo" },
  { value: "bom", label: "Bom" },
  { value: "regular", label: "Regular" },
  { value: "ruim", label: "Ruim" },
];

interface Props {
  churchId: string;
}

export function PatrimonioTab({ churchId }: Props) {
  const { assets, isLoading, createAsset, updateAsset, deleteAsset } = useChurchAssets(churchId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChurchAsset | null>(null);
  const [form, setForm] = useState<CreateAssetData>({
    name: "", category: "Outros", quantity: 1, condition: "bom",
    location: "", notes: "", estimated_value: 0,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", category: "Outros", quantity: 1, condition: "bom", location: "", notes: "", estimated_value: 0 });
    setModalOpen(true);
  };

  const openEdit = (a: ChurchAsset) => {
    setEditing(a);
    setForm({
      name: a.name, category: a.category, quantity: a.quantity,
      condition: a.condition || "bom", location: a.location || "",
      notes: a.notes || "", estimated_value: a.estimated_value || 0,
      acquired_at: a.acquired_at || undefined,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await updateAsset(editing.id, form);
    } else {
      await createAsset(form);
    }
    setModalOpen(false);
  };

  const totalValue = assets.reduce((s, a) => s + (a.estimated_value || 0) * a.quantity, 0);
  const totalItems = assets.reduce((s, a) => s + a.quantity, 0);

  // Group by category
  const grouped = assets.reduce<Record<string, ChurchAsset[]>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{totalItems} itens</span>
            <span>·</span>
            <span>Valor estimado: R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Item
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg">Nenhum patrimônio cadastrado</h3>
            <p className="text-muted-foreground text-sm mt-1">Cadastre os bens da igreja como cadeiras, som, instrumentos, etc.</p>
            <Button className="mt-4" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Cadastrar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <Card key={cat}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{cat}</CardTitle>
              <CardDescription>{items.length} {items.length === 1 ? "item" : "itens"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{a.condition || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{a.location || "—"}</TableCell>
                      <TableCell className="text-right">
                        {a.estimated_value ? `R$ ${Number(a.estimated_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteAsset(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Patrimônio" : "Novo Patrimônio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Item *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Cadeira de plástico" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.condition || "bom"} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Unitário (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.estimated_value || 0} onChange={e => setForm(f => ({ ...f, estimated_value: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Salão principal" />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
