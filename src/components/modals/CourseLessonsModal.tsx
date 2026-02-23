import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, GripVertical, Loader2, Video, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_type: string | null;
  lesson_order: number;
  duration_minutes: number | null;
}

interface CourseLessonsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}

export function CourseLessonsModal({ open, onOpenChange, courseId, courseName }: CourseLessonsModalProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoType, setNewVideoType] = useState("youtube");
  const [newDuration, setNewDuration] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && courseId) fetchLessons();
  }, [open, courseId]);

  const fetchLessons = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_order");
    if (!error) setLessons((data as Lesson[]) || []);
    setIsLoading(false);
  };

  const addLesson = async () => {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.lesson_order)) + 1 : 1;
    const { data, error } = await supabase
      .from("course_lessons")
      .insert([{
        course_id: courseId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        video_url: newVideoUrl.trim() || null,
        video_type: newVideoType,
        lesson_order: nextOrder,
        duration_minutes: newDuration ? parseInt(newDuration) : null,
      }])
      .select()
      .single();
    
    if (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar a aula.", variant: "destructive" });
    } else {
      setLessons(prev => [...prev, data as Lesson]);
      setNewTitle("");
      setNewDescription("");
      setNewVideoUrl("");
      setNewDuration("");
      toast({ title: "Sucesso", description: "Aula adicionada!" });
    }
    setIsAdding(false);
  };

  const removeLesson = async (id: string) => {
    const { error } = await supabase.from("course_lessons").delete().eq("id", id);
    if (!error) {
      setLessons(prev => prev.filter(l => l.id !== id));
      toast({ title: "Sucesso", description: "Aula removida." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Aulas - {courseName}
          </DialogTitle>
          <DialogDescription>
            Gerencie as aulas deste curso. Adicione vídeos do YouTube ou Vimeo.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : lessons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma aula cadastrada. Adicione a primeira abaixo.</p>
          ) : (
            <div className="space-y-2 pr-4">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {lesson.video_url && <Badge variant="outline" className="text-[10px]"><Video className="w-3 h-3 mr-1" />{lesson.video_type}</Badge>}
                      {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLesson(lesson.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Add new lesson form */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-semibold">Adicionar Aula</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Título da Aula *</Label>
              <Input placeholder="Ex: Introdução ao tema" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duração (minutos)</Label>
              <Input type="number" placeholder="30" value={newDuration} onChange={e => setNewDuration(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Textarea placeholder="Descrição da aula..." value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">URL do Vídeo</Label>
              <Input placeholder="https://youtube.com/watch?v=..." value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={newVideoType} onValueChange={setNewVideoType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addLesson} disabled={!newTitle.trim() || isAdding} className="w-full">
            {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Adicionar Aula
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
