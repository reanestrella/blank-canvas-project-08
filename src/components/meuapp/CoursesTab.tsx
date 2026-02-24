import { useState, useEffect } from "react";
import { Play, CheckCircle, ChevronRight, BookOpen, Award, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  description: string | null;
  track: string | null;
  is_active: boolean;
  cover_image_url: string | null;
}

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

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

interface CourseEnrollment {
  course_id: string;
  completed: boolean;
}

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
}

function getVimeoId(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] || null;
}

export function CoursesTab() {
  const { profile, user } = useAuth();
  const churchId = profile?.church_id;
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (churchId) fetchCourses();
  }, [churchId]);

  const fetchCourses = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("courses")
      .select("id, name, description, track, is_active, cover_image_url")
      .eq("church_id", churchId!)
      .eq("is_active", true)
      .order("name");
    setCourses((data as Course[]) || []);

    if (user) {
      const { data: enrollData } = await supabase
        .from("course_students")
        .select("course_id, completed")
        .eq("member_id", profile?.member_id || "");
      setEnrollments((enrollData as CourseEnrollment[]) || []);
    }
    setIsLoading(false);
  };

  const openCourse = async (course: Course) => {
    setSelectedCourse(course);
    const { data: lessonsData } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("course_id", course.id)
      .order("lesson_order");
    setLessons((lessonsData as Lesson[]) || []);

    if (user) {
      const lessonIds = (lessonsData || []).map((l: any) => l.id);
      if (lessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from("course_lesson_progress")
          .select("lesson_id, completed")
          .eq("user_id", user.id)
          .in("lesson_id", lessonIds);
        setLessonProgress((progressData as LessonProgress[]) || []);
      }
    }
  };

  const toggleLessonComplete = async (lessonId: string) => {
    if (!user) return;
    const existing = lessonProgress.find(p => p.lesson_id === lessonId);
    if (existing?.completed) {
      await supabase
        .from("course_lesson_progress")
        .update({ completed: false, completed_at: null })
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id);
      setLessonProgress(prev => prev.map(p => p.lesson_id === lessonId ? { ...p, completed: false } : p));
    } else {
      await supabase
        .from("course_lesson_progress")
        .upsert({ lesson_id: lessonId, user_id: user.id, completed: true, completed_at: new Date().toISOString() }, { onConflict: "lesson_id,user_id" });
      setLessonProgress(prev => {
        const exists = prev.find(p => p.lesson_id === lessonId);
        if (exists) return prev.map(p => p.lesson_id === lessonId ? { ...p, completed: true } : p);
        return [...prev, { lesson_id: lessonId, completed: true }];
      });
    }
  };

  const completedLessons = lessonProgress.filter(p => p.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

  // Group courses by track
  const tracks = [...new Set(courses.map(c => c.track || "Geral"))];

  const renderVideoEmbed = (lesson: Lesson) => {
    if (!lesson.video_url) return null;
    const ytId = getYouTubeId(lesson.video_url);
    const vimeoId = getVimeoId(lesson.video_url);

    if (ytId) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    }
    if (vimeoId) {
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
        <ExternalLink className="w-4 h-4" /> Abrir vídeo
      </a>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhum curso disponível no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {tracks.map(track => {
        const trackCourses = courses.filter(c => (c.track || "Geral") === track);
        return (
          <div key={track}>
            <h3 className="text-lg font-bold mb-3">{track}</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
              {trackCourses.map(course => {
                const enrolled = enrollments.find(e => e.course_id === course.id);
                const ytThumb = course.description?.match(/youtube\.com|youtu\.be/i)
                  ? `https://img.youtube.com/vi/${getYouTubeId(course.description || "")}/hqdefault.jpg`
                  : null;

                return (
                  <Card
                    key={course.id}
                    className="min-w-[260px] max-w-[280px] snap-start cursor-pointer hover:shadow-lg transition-all group flex-shrink-0"
                    onClick={() => openCourse(course)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                      {course.cover_image_url ? (
                        <img src={course.cover_image_url} alt={course.name} className="w-full h-full object-cover" />
                      ) : (
                        <Play className="w-12 h-12 text-primary/40 group-hover:text-primary/70 transition-colors" />
                      )}
                      {enrolled?.completed && (
                        <Badge className="absolute top-2 right-2 bg-success text-success-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" /> Concluído
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2">{course.name}</h4>
                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                      )}
                      {enrolled && !enrolled.completed && (
                        <Badge variant="secondary" className="mt-2 text-xs">Em andamento</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={(open) => { if (!open) { setSelectedCourse(null); setSelectedLesson(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {selectedCourse?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedLesson ? (
            <div className="space-y-4 overflow-y-auto">
              <Button variant="ghost" size="sm" onClick={() => setSelectedLesson(null)} className="mb-2">
                ← Voltar às aulas
              </Button>
              <h3 className="text-lg font-semibold">{selectedLesson.title}</h3>
              {selectedLesson.description && (
                <p className="text-sm text-muted-foreground">{selectedLesson.description}</p>
              )}
              {renderVideoEmbed(selectedLesson)}
              <Button
                onClick={() => toggleLessonComplete(selectedLesson.id)}
                variant={lessonProgress.find(p => p.lesson_id === selectedLesson.id)?.completed ? "secondary" : "default"}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {lessonProgress.find(p => p.lesson_id === selectedLesson.id)?.completed ? "Marcar como não concluída" : "Marcar como concluída"}
              </Button>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {selectedCourse?.description && (
                  <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                )}

                {lessons.length > 0 && (
                  <>
                    <div className="flex items-center gap-3">
                      <Progress value={progressPercent} className="flex-1" />
                      <span className="text-sm font-medium text-muted-foreground">{progressPercent}%</span>
                    </div>

                    <div className="space-y-2">
                      {lessons.map((lesson, i) => {
                        const isCompleted = lessonProgress.find(p => p.lesson_id === lesson.id)?.completed;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                              isCompleted ? "bg-success/10" : "bg-muted/50 hover:bg-muted"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                              isCompleted ? "bg-success text-success-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                            )}>
                              {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                              {lesson.duration_minutes && (
                                <p className="text-xs text-muted-foreground">{lesson.duration_minutes} min</p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {lessons.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma aula cadastrada neste curso ainda.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
