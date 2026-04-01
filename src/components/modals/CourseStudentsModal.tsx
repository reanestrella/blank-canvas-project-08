import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import { Loader2, Plus, CheckCircle2, UserPlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMembers } from "@/hooks/useMembers";

interface CourseStudent {
  id: string;
  course_id: string;
  member_id: string;
  enrolled_at: string;
  completed: boolean;
  completed_at: string | null;
}

interface CourseStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
  churchId: string;
}

export function CourseStudentsModal({ open, onOpenChange, courseId, courseName, churchId }: CourseStudentsModalProps) {
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { members } = useMembers(churchId || undefined);

  const fetchStudents = async () => {
    if (!courseId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("course_students")
      .select("*")
      .eq("course_id", courseId)
      .order("enrolled_at", { ascending: false });
    setStudents((data as CourseStudent[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (open && courseId) fetchStudents();
  }, [open, courseId]);

  const getMemberName = (memberId: string) => {
    return members.find(m => m.id === memberId)?.full_name || "Desconhecido";
  };

  const handleAddStudent = async () => {
    if (!selectedMemberId) return;
    // Check if already enrolled
    if (students.some(s => s.member_id === selectedMemberId)) {
      toast({ title: "Aviso", description: "Este membro já está matriculado.", variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      const { error } = await supabase.from("course_students").insert([{
        course_id: courseId,
        member_id: selectedMemberId,
      }]);
      if (error) throw error;
      toast({ title: "Aluno adicionado!" });
      setSelectedMemberId(null);
      fetchStudents();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (student: CourseStudent) => {
    try {
      const newCompleted = !student.completed;
      const { error } = await supabase.from("course_students").update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      }).eq("id", student.id);
      if (error) throw error;
      fetchStudents();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveStudent = async (id: string) => {
    try {
      const { error } = await supabase.from("course_students").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Aluno removido." });
      fetchStudents();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const completedCount = students.filter(s => s.completed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alunos — {courseName}</DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <Badge variant="secondary">{students.length} matriculados</Badge>
          <Badge variant="secondary" className="bg-success/10 text-success">{completedCount} concluíram</Badge>
        </div>

        {/* Add student */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <MemberAutocomplete
              churchId={churchId}
              value={selectedMemberId || undefined}
              onChange={setSelectedMemberId}
              placeholder="Adicionar aluno..."
            />
          </div>
          <Button onClick={handleAddStudent} disabled={!selectedMemberId || isAdding} size="sm">
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
            Adicionar
          </Button>
        </div>

        {/* Students list */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : students.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum aluno matriculado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(student => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getMemberName(student.member_id).split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{getMemberName(student.member_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(student.enrolled_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={student.completed ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${student.completed ? "bg-success hover:bg-success/90" : ""}`}
                      onClick={() => handleToggleComplete(student)}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {student.completed ? "Concluído" : "Concluir"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveStudent(student.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
