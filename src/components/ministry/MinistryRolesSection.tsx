import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, UserPlus, X, Loader2, Search, Printer } from "lucide-react";
import { exportToPdf } from "@/lib/pdfExport";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMinistryRoles } from "@/hooks/useMinistryRoles";
import type { Member } from "@/hooks/useMembers";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "🎵 Música": [
    "🎹", "🎸", "🥁", "🎤", "🎵", "🎼", "🎧", "🎺", "🎷", "🎻",
    "🪕", "🪗", "🪘", "🔔", "🎶", "🎙️", "📻", "🎚️", "🎛️", "🪇",
  ],
  "👶 Crianças": [
    "👧", "🍼", "🧒", "👶", "🎒", "🧸", "🎠", "🎡", "🖍️", "📚",
    "🎈", "🧩", "🎪", "🎨", "🏫", "✏️", "📏", "🎓", "👦", "👧",
  ],
  "🤝 Serviço": [
    "🧹", "🤝", "📷", "💻", "📱", "🔧", "🚗", "🏠", "🍽️", "☕",
    "🛠️", "🪣", "🧽", "🧤", "👷", "🔑", "📦", "🎪", "🚚", "🏗️",
  ],
  "✝️ Espiritual": [
    "🙏", "📖", "✝️", "❤️", "🕊️", "⛪", "🔥", "💧", "🌿", "✨",
    "👑", "🕯️", "📜", "🫶", "💒", "🌟", "☀️", "🌈", "💎", "🪔",
  ],
  "🎨 Mídia/Arte": [
    "🎨", "📸", "🎬", "📹", "🖥️", "📡", "🎞️", "🖼️", "✍️", "🖊️",
    "📐", "🎭", "💡", "📊", "📋", "🗂️", "🗓️", "📌", "📝", "🔍",
  ],
  "🏃 Atividades": [
    "🏃", "⚽", "🏀", "🎯", "🏋️", "🤸", "🚴", "🏕️", "🎣", "🥾",
    "🧗", "🏊", "🏆", "🥇", "🤾", "🎳", "🛹", "🎤", "🤹", "🎱",
  ],
  "👤 Geral": [
    "👤", "⭐", "🎯", "💡", "🌍", "🌱", "🛡️", "⚡", "🎗️", "🏅",
    "🧑‍🏫", "🧑‍⚕️", "🧑‍🍳", "🧑‍🔬", "🧑‍🎨", "🧑‍✈️", "🧑‍🚒", "🦸", "🤵", "👰",
  ],
};

interface MinistryRolesSectionProps {
  ministryId: string;
  churchId: string;
  members: Member[];
  canEdit: boolean;
  ministryName?: string;
  churchName?: string;
}

export function MinistryRolesSection({ ministryId, churchId, members, canEdit, ministryName, churchName }: MinistryRolesSectionProps) {
  const { roles, roleMembers, isLoading, createRole, deleteRole, addMember, removeMember } = useMinistryRoles(ministryId, churchId);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("👤");
  const [addingToRoleId, setAddingToRoleId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [emojiSearch, setEmojiSearch] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createRole(newName.trim(), newIcon);
    setNewName("");
    setNewIcon("👤");
    setShowCreate(false);
  };

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.full_name || "Desconhecido";
  };

  const handlePrint = () => {
    const rows: Record<string, string>[] = [];
    roles.forEach(role => {
      const membersInRole = roleMembers.filter(rm => rm.ministry_role_id === role.id);
      membersInRole.forEach(rm => {
        const member = members.find(m => m.id === rm.member_id);
        rows.push({
          name: member?.full_name ?? "Desconhecido",
          role: `${role.icon} ${role.name}`,
          phone: member?.phone ?? "",
        });
      });
    });
    exportToPdf({
      title: `Membros — ${ministryName ?? "Ministério"}`,
      churchName,
      columns: [
        { header: "Nome", dataKey: "name" },
        { header: "Função", dataKey: "role" },
        { header: "Telefone", dataKey: "phone" },
      ],
      rows,
      filename: `membros_${(ministryName ?? "ministerio").toLowerCase().replace(/\s+/g, "_")}.pdf`,
    });
  };

  const handleAddMember = async () => {
    if (!addingToRoleId || !selectedMemberId) return;
    await addMember(addingToRoleId, selectedMemberId);
    setSelectedMemberId("");
    setAddingToRoleId(null);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Funções do Ministério</h3>
        <div className="flex items-center gap-2">
          {roleMembers.length > 0 && (
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir Membros
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova Função
            </Button>
          )}
        </div>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">Nenhuma função cadastrada.</p>
            {canEdit && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" /> Criar primeira função
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => {
            const membersInRole = roleMembers.filter(rm => rm.ministry_role_id === role.id);
            return (
              <Card key={role.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{role.icon}</span>
                      <span className="font-semibold">{role.name}</span>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRole(role.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {membersInRole.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum membro</p>
                    ) : (
                      membersInRole.map(rm => (
                        <div key={rm.id} className="flex items-center justify-between text-sm">
                          <span>{getMemberName(rm.member_id)}</span>
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMember(rm.id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => { setAddingToRoleId(role.id); setSelectedMemberId(""); }}>
                      <UserPlus className="w-3.5 h-3.5 mr-1" /> Adicionar
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Role Dialog with expanded emoji picker */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Teclado, Recepção..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ícone: <span className="text-2xl ml-1">{newIcon}</span></label>
              <Tabs defaultValue={Object.keys(EMOJI_CATEGORIES)[0]} className="w-full">
                <TabsList className="w-full flex-wrap h-auto gap-0.5 p-1">
                  {Object.keys(EMOJI_CATEGORIES).map(cat => (
                    <TabsTrigger key={cat} value={cat} className="text-xs px-2 py-1">
                      {cat.split(" ")[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                  <TabsContent key={cat} value={cat} className="mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {emojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${newIcon === emoji ? "border-primary bg-primary/10" : "border-transparent hover:border-muted"}`}
                          onClick={() => setNewIcon(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={!!addingToRoleId} onOpenChange={open => !open && setAddingToRoleId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Membro à Função</DialogTitle>
          </DialogHeader>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um membro" />
            </SelectTrigger>
            <SelectContent>
              {members.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingToRoleId(null)}>Cancelar</Button>
            <Button onClick={handleAddMember} disabled={!selectedMemberId}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
