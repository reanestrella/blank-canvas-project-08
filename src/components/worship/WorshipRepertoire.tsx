import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Music, ExternalLink, Search, Loader2, Trash2, Edit, BarChart3,
} from "lucide-react";
import { useWorshipSongs, useWorshipStats, type WorshipSong } from "@/hooks/useWorshipSongs";

const KEY_SIGNATURES = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
  "Cm", "C#m", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bbm", "Bm",
];

const TAG_OPTIONS = [
  "Adoração", "Celebração", "Ceia", "Oferta", "Abertura", "Encerramento",
  "Natal", "Páscoa", "Infantil", "Jovens", "Oração", "Louvor",
];

interface Props {
  churchId: string;
  canEdit: boolean;
}

export function WorshipRepertoire({ churchId, canEdit }: Props) {
  const { songs, isLoading, createSong, updateSong, deleteSong } = useWorshipSongs(churchId);
  const { stats } = useWorshipStats(churchId);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<WorshipSong | null>(null);
  const [form, setForm] = useState({
    title: "", artist: "", key_signature: "", bpm: "",
    tags: [] as string[], chord_url: "", audio_url: "",
  });

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.artist || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const getSongStats = (songId: string) => stats.find(s => s.song_id === songId);

  const openNew = () => {
    setEditingSong(null);
    setForm({ title: "", artist: "", key_signature: "", bpm: "", tags: [], chord_url: "", audio_url: "" });
    setModalOpen(true);
  };

  const openEdit = (song: WorshipSong) => {
    setEditingSong(song);
    setForm({
      title: song.title, artist: song.artist || "", key_signature: song.key_signature || "",
      bpm: song.bpm?.toString() || "", tags: song.tags || [],
      chord_url: song.chord_url || "", audio_url: song.audio_url || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload: any = {
      title: form.title,
      artist: form.artist || null,
      key_signature: form.key_signature || null,
      bpm: form.bpm ? parseInt(form.bpm) : null,
      tags: form.tags,
      chord_url: form.chord_url || null,
      audio_url: form.audio_url || null,
    };
    if (editingSong) {
      await updateSong(editingSong.id, payload);
    } else {
      await createSong(payload);
    }
    setModalOpen(false);
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por título, artista ou tag..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {canEdit && (
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Adicionar Música</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma música cadastrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(song => {
            const st = getSongStats(song.id);
            return (
              <Card key={song.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{song.title}</h4>
                        {song.key_signature && (
                          <Badge variant="outline" className="text-xs">Tom: {song.key_signature}</Badge>
                        )}
                        {song.bpm && (
                          <Badge variant="secondary" className="text-xs">{song.bpm} BPM</Badge>
                        )}
                      </div>
                      {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(song.tags || []).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {song.chord_url && (
                          <a href={song.chord_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />Cifra
                          </a>
                        )}
                        {song.audio_url && (
                          <a href={song.audio_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />Áudio
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {st && (
                        <div className="text-right text-xs space-y-0.5">
                          <p className="text-muted-foreground flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Mês: <span className="font-medium text-foreground">{st.played_month}</span>
                            {" "}Ano: <span className="font-medium text-foreground">{st.played_year}</span>
                            {" "}Total: <span className="font-bold text-foreground">{st.played_total}</span>
                          </p>
                        </div>
                      )}
                      {canEdit && (
                        <div className="flex gap-1 mt-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(song)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSong(song.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Song Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSong ? "Editar Música" : "Nova Música"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Nome da música" />
            </div>
            <div>
              <Label>Artista</Label>
              <Input value={form.artist} onChange={e => setForm(p => ({ ...p, artist: e.target.value }))} placeholder="Ex: Hillsong" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tom</Label>
                <Select value={form.key_signature} onValueChange={v => setForm(p => ({ ...p, key_signature: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {KEY_SIGNATURES.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>BPM</Label>
                <Input type="number" value={form.bpm} onChange={e => setForm(p => ({ ...p, bpm: e.target.value }))} placeholder="Ex: 120" />
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {TAG_OPTIONS.map(tag => (
                  <Badge
                    key={tag}
                    variant={form.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Link da Cifra (URL)</Label>
              <Input value={form.chord_url} onChange={e => setForm(p => ({ ...p, chord_url: e.target.value }))} placeholder="https://www.cifraclub.com.br/..." />
            </div>
            <div>
              <Label>Link de Áudio (URL)</Label>
              <Input value={form.audio_url} onChange={e => setForm(p => ({ ...p, audio_url: e.target.value }))} placeholder="https://youtube.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>
              {editingSong ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
