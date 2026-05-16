import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { FinancialCategory } from "@/hooks/useFinancial";

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6B7280",
];

const PRESET_ICONS = ["💰","💵","🏦","💡","💧","🛠","🎤","📚","🍽","🚗","❤️","🎁","🏗","📺","✨","📌"];

type Mode = "create" | "edit";

interface CategoriesTabProps {
  allCategories: FinancialCategory[];
  onCreate: (data: {
    name: string;
    type: "receita" | "despesa" | "ambos";
    church_id: string;
    color?: string | null;
    icon?: string | null;
    description?: string | null;
    sort_order?: number;
  }) => Promise<any>;
  onUpdate: (id: string, data: Partial<FinancialCategory>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  churchId: string;
}

export function CategoriesTab({
  allCategories, onCreate, onUpdate, onDelete, churchId,
}: CategoriesTabProps) {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole("pastor", "tesoureiro", "secretario");

  const [tab, setTab] = useState<"receita" | "despesa" | "ambos">("receita");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editing, setEditing] = useState<FinancialCategory | null>(null);
  const [deleting, setDeleting] = useState<FinancialCategory | null>(null);

  const [form, setForm] = useState<{
    name: string;
    type: "receita" | "despesa" | "ambos";
    color: string;
    icon: string;
    description: string;
    is_active: boolean;
  }>({
    name: "", type: "receita", color: PRESET_COLORS[0], icon: "", description: "", is_active: true,
  });

  const filtered = useMemo(
    () => allCategories
      .filter((c) => c.type === tab)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)),
    [allCategories, tab]
  );

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setForm({
      name: "", type: tab, color: PRESET_COLORS[0], icon: "", description: "", is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (cat: FinancialCategory) => {
    setMode("edit");
    setEditing(cat);
    setForm({
      name: cat.name,
      type: cat.type,
      color: cat.color || PRESET_COLORS[0],
      icon: cat.icon || "",
      description: cat.description || "",
      is_active: cat.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (mode === "create") {
      const res = await onCreate({
        name: form.name.trim(),
        type: form.type,
        church_id: churchId,
        color: form.color || null,
        icon: form.icon || null,
        description: form.description || null,
      });
      if (!res.error) setModalOpen(false);
    } else if (editing) {
      const res = await onUpdate(editing.id, {
        name: form.name.trim(),
        type: form.type,
        color: form.color || null,
        icon: form.icon || null,
        description: form.description || null,
        is_active: form.is_active,
      });
      if (!res.error) setModalOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Categorias financeiras</CardTitle>
          <CardDescription>
            Personalize categorias por igreja. Categorias padrão do sistema não podem ser excluídas, mas podem ser desativadas.
          </CardDescription>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nova categoria
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="receita">Receitas</TabsTrigger>
            <TabsTrigger value="despesa">Despesas</TabsTrigger>
            <TabsTrigger value="ambos">Ambos</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma categoria nesta lista.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    {canManage && <TableHead className="w-[120px] text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {c.color && (
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: c.color }}
                            />
                          )}
                          {c.icon && <span aria-hidden>{c.icon}</span>}
                          <span className="font-medium">{c.name}</span>
                        </div>
                        {c.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{c.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.is_active ? (
                          <Badge className="bg-success/20 text-success">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.is_system ? (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="w-3 h-3" /> Sistema
                          </Badge>
                        ) : (
                          <Badge variant="outline">Personalizada</Badge>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!c.is_system && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => setDeleting(c)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Nova categoria" : "Editar categoria"}</DialogTitle>
            <DialogDescription>
              {editing?.is_system
                ? "Esta é uma categoria do sistema. Você pode renomear, alterar cor/ícone e desativar — mas não excluir."
                : "Defina o nome, tipo, cor e ícone da categoria."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Congresso anual"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="ambos">Ambos (receita e despesa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Ícone (opcional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, icon: "" })}
                  className={`w-8 h-8 rounded-md border text-xs ${
                    !form.icon ? "border-foreground bg-muted" : "border-input"
                  }`}
                >
                  —
                </button>
                {PRESET_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, icon: i })}
                    className={`w-8 h-8 rounded-md border text-lg ${
                      form.icon === i ? "border-foreground bg-muted" : "border-input"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            {mode === "edit" && (
              <div className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="text-sm font-medium">Categoria ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Categorias inativas não aparecem em novos lançamentos, mas o histórico é preservado.
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação só é permitida se não houver lançamentos vinculados a "{deleting?.name}".
              Caso existam, desative a categoria em vez de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleting) {
                  await onDelete(deleting.id);
                  setDeleting(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
