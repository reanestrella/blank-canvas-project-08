import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  GraduationCap,
  BookOpen,
  Users,
  Trophy,
  Plus,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCourses, CreateCourseData } from "@/hooks/useCourses";
import { useMembers } from "@/hooks/useMembers";
import { CourseModal } from "@/components/modals/CourseModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import type { Course } from "@/hooks/useCourses";

const trackColors: Record<string, string> = {
  novo_convertido: "bg-info/20 text-info",
  discipulado: "bg-secondary/20 text-secondary",
  lideranca: "bg-success/20 text-success",
  ebd: "bg-primary/20 text-primary",
};

const trackLabels: Record<string, string> = {
  novo_convertido: "Novo Convertido",
  discipulado: "Discipulado",
  lideranca: "Liderança",
  ebd: "EBD",
};

export default function Ensino() {
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const { courses, isLoading, createCourse, updateCourse, deleteCourse } = useCourses(churchId || undefined);
  const { members } = useMembers(churchId || undefined);

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return "Sem professor";
    const member = members.find(m => m.id === memberId);
    return member?.full_name || "Desconhecido";
  };

  const handleCreateCourse = async (data: Partial<Course>) => {
    if (!churchId) return { data: null, error: new Error("Igreja não identificada") };
    const createData: CreateCourseData & { church_id: string } = {
      name: data.name || "",
      description: data.description || undefined,
      track: data.track || undefined,
      teacher_id: data.teacher_id || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      church_id: churchId,
    };
    return createCourse(createData);
  };

  const handleUpdateCourse = async (data: Partial<Course>) => {
    if (!editingCourse) return { data: null, error: new Error("No course to edit") };
    return updateCourse(editingCourse.id, data);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setCourseModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setCourseModalOpen(open);
    if (!open) {
      setEditingCourse(undefined);
    }
  };

  const stats = [
    { label: "Cursos Ativos", value: courses.filter(c => c.is_active).length, icon: BookOpen, color: "text-primary" },
    { label: "Total de Cursos", value: courses.length, icon: GraduationCap, color: "text-info" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Ensino & Discipulado</h1>
            <p className="text-muted-foreground">
              Gerencie cursos, EBD e trilhas espirituais
            </p>
          </div>
          <Button 
            className="gradient-accent text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              setEditingCourse(undefined);
              setCourseModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Curso
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Courses */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cursos</h2>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum curso</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando o primeiro curso.
                </p>
                <Button onClick={() => setCourseModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Curso
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold">{course.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {course.description || "Sem descrição"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {course.track && (
                              <Badge
                                variant="secondary"
                                className={trackColors[course.track] || ""}
                              >
                                {trackLabels[course.track] || course.track}
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(course)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>Ver alunos</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeletingCourse(course)}
                                >
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          {course.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Início: {new Date(course.start_date).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {course.end_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Término: {new Date(course.end_date).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-muted">
                              {getMemberName(course.teacher_id).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {getMemberName(course.teacher_id)}
                          </span>
                          <Badge variant={course.is_active ? "default" : "secondary"} className="ml-auto">
                            {course.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Modal */}
      <CourseModal
        open={courseModalOpen}
        onOpenChange={handleCloseModal}
        course={editingCourse}
        members={members}
        onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        title="Excluir Curso"
        description={`Tem certeza que deseja excluir "${deletingCourse?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteCourse(deletingCourse!.id)}
      />
    </AppLayout>
  );
}
