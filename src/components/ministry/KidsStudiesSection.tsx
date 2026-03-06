import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, FileText, ExternalLink, Loader2, Search, X, Lightbulb, Upload,
} from "lucide-react";
import { useKidsStudies, KidsSuggestion } from "@/hooks/useKidsStudies";

interface KidsStudiesSectionProps {
  churchId: string;
  canEdit: boolean;
  memberId?: string;
}

const AGE_GROUPS = ["0-3 anos", "4-6 anos", "7-9 anos", "10-12 anos", "Todas as idades"];

const SUGGESTION_TYPES: { value: string; label: string; emoji: string }[] = [
  { value: "dinamica", label: "Dinâmica", emoji: "🎯" },
  { value: "material", label: "Material complementar", emoji: "📚" },
  { value: "atividade", label: "Atividade", emoji: "✂️" },
  { value: "versiculo", label: "Versículo-chave", emoji: "📖" },
  { value: "dica", label: "Dica para professor", emoji: "💡" },
];

export function KidsStudiesSection({ churchId, canEdit, memberId }: KidsStudiesSectionProps) {
  const { studies, isLoading, createStudy, updateStudy, deleteStudy, uploadFile } = useKidsStudies(churchId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [studyDate, setStudyDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [suggestions, setSuggestions] = useState<KidsSuggestion[]>([]);
  const [newSuggText, setNewSuggText] = useState("");
  const [newSuggType, setNewSuggType] = useState("dica");

  // Detail view
  const [viewStudyId, setViewStudyId] = useState<string | null>(null);
  const viewStudy = viewStudyId ? studies.find(s => s.id === viewStudyId) : null;

  const resetForm = () => {
    setTitle(""); setDescription(""); setAgeGroup(""); setStudyDate("");
    setFileUrl(""); setSuggestions([]); setNewSuggText(""); setNewSuggType("dica");
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };

  const openEdit = (study: any) => {
    setEditingId(study.id);
    setTitle(study.title);
    setDescription(study.description || "");
    setAgeGroup(study.age_group || "");
    setStudyDate(study.study_date || "");
    setFileUrl(study.file_url || "");
    setSuggestions(study.suggestions || []);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setFileUrl(url);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addSuggestion = () => {
    if (!newSuggText.trim()) return;
    setSuggestions(prev => [...prev, { text: newSuggText.trim(), type: newSuggType }]);
    setNewSuggText("");
  };

  const removeSuggestion = (idx: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      age_group: ageGroup || undefined,
      study_date: studyDate || undefined,
      file_url: fileUrl || undefined,
      suggestions,
      created_by_member_id: memberId || undefined,
    };
    if (editingId) {
      await updateStudy(editingId, data);
    } else {
      await createStudy(data);
    }
    setSaving(false);
    setModalOpen(false);
    resetForm();
  };

  const filtered = studies.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const getSuggEmoji = (type?: string) => SUGGESTION_TYPES.find(t => t.value === type)?.emoji || "💡";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold flex items-center gap-2">📚 Estudos Kids</h3>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Novo Estudo
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum estudo cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(study => (
            <Card key={study.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setViewStudyId(study.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{study.title}</h4>
                    {study.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{study.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {study.age_group && <Badge variant="secondary" className="text-[10px]">{study.age_group}</Badge>}
                      {study.study_date && <Badge variant="outline" className="text-[10px]">{study.study_date}</Badge>}
                      {study.file_url && <Badge variant="outline" className="text-[10px]">📎 Arquivo</Badge>}
                      {study.suggestions.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">💡 {study.suggestions.length} sugestões</Badge>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(study); }}>
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); deleteStudy(study.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Study Detail */}
      <Dialog open={!!viewStudy} onOpenChange={open => { if (!open) setViewStudyId(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {viewStudy && (
            <>
              <DialogHeader>
                <DialogTitle>{viewStudy.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {viewStudy.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Resumo</p>
                    <p className="text-sm">{viewStudy.description}</p>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {viewStudy.age_group && <Badge variant="secondary">{viewStudy.age_group}</Badge>}
                  {viewStudy.study_date && <Badge variant="outline">📅 {viewStudy.study_date}</Badge>}
                </div>
                {viewStudy.file_url && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Arquivo Anexado</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={viewStudy.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" /> Abrir / Baixar Arquivo
                      </a>
                    </Button>
                  </div>
                )}
                {viewStudy.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Sugestões</p>
                    <div className="space-y-2">
                      {viewStudy.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                          <span className="text-sm">{getSuggEmoji(s.type)}</span>
                          <div className="flex-1">
                            <p className="text-sm">{s.text}</p>
                            {s.type && (
                              <span className="text-[10px] text-muted-foreground capitalize">
                                {SUGGESTION_TYPES.find(t => t.value === s.type)?.label || s.type}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) { setModalOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Estudo" : "Novo Estudo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: A história de Noé" />
            </div>
            <div>
              <label className="text-sm font-medium">Resumo / Descrição</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição do estudo..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Faixa Etária</label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input type="date" value={studyDate} onChange={e => setStudyDate(e.target.value)} />
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="text-sm font-medium">Arquivo (PDF, DOC, DOCX, PPT)</label>
              <div className="flex items-center gap-2 mt-1">
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                  {uploading ? "Enviando..." : "Escolher arquivo"}
                </Button>
                {fileUrl && (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">📎 Anexado</Badge>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFileUrl("")}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Lightbulb className="w-4 h-4" /> Sugestões ({suggestions.length})
              </label>
              <div className="flex gap-2 mt-1">
                <Select value={newSuggType} onValueChange={setNewSuggType}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUGGESTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.emoji} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newSuggText}
                  onChange={e => setNewSuggText(e.target.value)}
                  placeholder="Texto da sugestão..."
                  className="flex-1"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSuggestion(); } }}
                />
                <Button size="icon" onClick={addSuggestion} disabled={!newSuggText.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                      <span className="text-sm">{getSuggEmoji(s.type)}</span>
                      <span className="text-sm flex-1">{s.text}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeSuggestion(i)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingId ? "Salvar" : "Criar Estudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
