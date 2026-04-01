import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MemberAutocomplete } from "@/components/ui/member-autocomplete";
import {
  Users, CheckCircle2, UserPlus, Trash2, Loader2, BookOpen,
  Trophy, BarChart3, ArrowLeft, GraduationCap, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMembers } from "@/hooks/useMembers";
import type { Course } from "@/hooks/useCourses";

interface CourseStudent {
  id: string;
  course_id: string;
  member_id: string;
  enrolled_at: string;
  completed: boolean;
  completed_at: string | null;
}

interface CourseLesson {
  id: string;
  title: string;
  lesson_order: number;
}

interface LessonProgress {
  lesson_id: string;
  user_id: string;
  completed: boolean;
}

interface CourseDetailViewProps {
  course: Course;
  churchId: string;
  onBack: () => void;
}

export function CourseDetailView({ course, churchId, onBack }: CourseDetailViewProps) {
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { members } = useMembers(churchId);

  const fetchData = async () => {
    setIsLoading(true);
    const [studentsRes, lessonsRes] = await Promise.all([
      supabase.from("course_students").select("*").eq("course_id", course.id).order("enrolled_at"),
      supabase.from("course_lessons").select("id, title, lesson_order").eq("course_id", course.id).order("lesson_order"),
    ]);
    const studentsData = (studentsRes.data as CourseStudent[]) || [];
    const lessonsData = (lessonsRes.data as CourseLesson[]) || [];
    setStudents(studentsData);
    setLessons(lessonsData);

    // Fetch lesson progress for all lessons
    if (lessonsData.length > 0) {
      const lessonIds = lessonsData.map(l => l.id);
      const { data: progressData } = await supabase
        .from("course_lesson_progress")
        .select("lesson_id, user_id, completed")
        .in("lesson_id", lessonIds);
      setLessonProgress((progressData as LessonProgress[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [course.id]);

  const getMemberName = (memberId: string) =>
    members.find(m => m.id === memberId)?.full_name || "Desconhecido";

  const handleAddStudent = async () => {
    if (!selectedMemberId) return;
    if (students.some(s => s.member_id === selectedMemberId)) {
      toast({ title: "Aviso", description: "Já matriculado.", variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      const { error } = await supabase.from("course_students").insert([{
        course_id: course.id, member_id: selectedMemberId,
      }]);
      if (error) throw error;
      toast({ title: "Aluno adicionado!" });
      setSelectedMemberId(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleComplete = async (student: CourseStudent) => {
    const newCompleted = !student.completed;
    const { error } = await supabase.from("course_students").update({
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq("id", student.id);
    if (!error) fetchData();
  };

  const handleRemoveStudent = async (id: string) => {
    const { error } = await supabase.from("course_students").delete().eq("id", id);
    if (!error) { toast({ title: "Aluno removido." }); fetchData(); }
  };

  // Stats
  const totalStudents = students.length;
  const completedStudents = students.filter(s => s.completed).length;
  const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
  const inProgressStudents = totalStudents - completedStudents;

  // Per-student attendance: how many lessons they completed out of total
  const studentAttendance = useMemo(() => {
    if (lessons.length === 0) return new Map<string, number>();
    const map = new Map<string, number>();
    // We need to map member_id to user_id — lesson progress uses user_id
    // For now show based on lesson_progress data
    students.forEach(s => {
      // Count completed lessons for this student's member_id
      // Note: lesson progress tracks by user_id, we'll count by member_id match via profiles
      // Simplified: count all progress entries
      map.set(s.member_id, 0);
    });
    return map;
  }, [students, lessonProgress, lessons]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{course.name}</h2>
          <p className="text-sm text-muted-foreground">{course.description || "Sem descrição"}</p>
        </div>
        <Badge variant={course.is_active ? "default" : "secondary"}>
          {course.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Matriculados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><Trophy className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-2xl font-bold">{completedStudents}</p>
              <p className="text-xs text-muted-foreground">Concluíram</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10"><BookOpen className="w-5 h-5 text-info" /></div>
            <div>
              <p className="text-2xl font-bold">{inProgressStudents}</p>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><BarChart3 className="w-5 h-5 text-secondary" /></div>
            <div>
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Conclusão</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Taxa de Conclusão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedStudents} de {totalStudents} alunos concluíram o curso
          </p>
        </CardContent>
      </Card>

      {/* Lessons summary */}
      {lessons.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aulas ({lessons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs font-medium truncate">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">Aula {i + 1}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add student */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alunos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {students.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhum aluno matriculado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Conclusão</TableHead>
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
                        {student.completed ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" />Pendente</>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {student.completed_at
                        ? new Date(student.completed_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveStudent(student.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
