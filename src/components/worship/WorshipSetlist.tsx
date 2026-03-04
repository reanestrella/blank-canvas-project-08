import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Calendar, Loader2, Trash2, Music, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWorshipSets, useWorshipSetSongs, useWorshipSongs } from "@/hooks/useWorshipSongs";

interface Props {
  churchId: string;
  ministryId: string;
  canEdit: boolean;
  memberId?: string;
}

export function WorshipSetlist({ churchId, ministryId, canEdit, memberId }: Props) {
  const { sets, isLoading, createSet, deleteSet } = useWorshipSets(churchId, ministryId);
  const { songs } = useWorshipSongs(churchId);
  const [newSetOpen, setNewSetOpen] = useState(false);
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const handleCreateSet = async () => {
    if (!newTitle || !newDate) return;
    await createSet({ title: newTitle, date: newDate, created_by_member_id: memberId });
    setNewSetOpen(false);
    setNewTitle("");
    setNewDate("");
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cultos / Ensaios</h3>
        {canEdit && (
          <Button onClick={() => setNewSetOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Culto</Button>
        )}
      </div>

      {sets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum culto/ensaio registrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sets.map(set => (
            <Card key={set.id}>
              <CardContent className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedSet(expandedSet === set.id ? null : set.id)}
                >
                  <div>
                    <h4 className="font-semibold">{set.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(set.date + "T12:00:00"), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={e => { e.stopPropagation(); deleteSet(set.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                    {expandedSet === set.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {expandedSet === set.id && (
                  <SetSongsPanel setId={set.id} churchId={churchId} songs={songs} canEdit={canEdit} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={newSetOpen} onOpenChange={setNewSetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Culto / Ensaio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Culto Domingo Noite" />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSetOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSet} disabled={!newTitle || !newDate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SetSongsPanel({ setId, churchId, songs, canEdit }: { setId: string; churchId: string; songs: any[]; canEdit: boolean }) {
  const { setSongs, addSongToSet, removeSongFromSet } = useWorshipSetSongs(setId, churchId);
  const [selectedSong, setSelectedSong] = useState("");

  const availableSongs = songs.filter(s => !setSongs.some(ss => ss.song_id === s.id));

  const handleAdd = async () => {
    if (!selectedSong) return;
    await addSongToSet(selectedSong, setSongs.length);
    setSelectedSong("");
  };

  return (
    <div className="mt-4 pt-3 border-t space-y-3">
      {canEdit && (
        <div className="flex gap-2">
          <Select value={selectedSong} onValueChange={setSelectedSong}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Adicionar música..." />
            </SelectTrigger>
            <SelectContent>
              {availableSongs.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title} {s.key_signature ? `(${s.key_signature})` : ""} — {s.artist || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" onClick={handleAdd} disabled={!selectedSong}><Plus className="w-4 h-4" /></Button>
        </div>
      )}

      {setSongs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">Nenhuma música neste setlist.</p>
      ) : (
        <div className="space-y-2">
          {setSongs.map((ss, idx) => (
            <div key={ss.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
              <Music className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ss.song?.title || "?"}</p>
                <div className="flex items-center gap-2">
                  {(ss.played_key_override || ss.song?.key_signature) && (
                    <Badge variant="outline" className="text-[10px]">
                      Tom: {ss.played_key_override || ss.song?.key_signature}
                    </Badge>
                  )}
                  {ss.song?.chord_url && (
                    <a href={ss.song.chord_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5" />Cifra
                    </a>
                  )}
                </div>
              </div>
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                  onClick={() => removeSongFromSet(ss.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
