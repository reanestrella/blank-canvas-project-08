import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Course {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  track: string | null;
  teacher_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateCourseData {
  name: string;
  description?: string;
  track?: string;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
}

export function useCourses(churchId?: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("courses")
        .select("*")
        .order("name");
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setCourses((data as Course[]) || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cursos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCourse = async (data: CreateCourseData & { church_id: string }) => {
    try {
      const { data: newCourse, error } = await supabase
        .from("courses")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setCourses((prev) => [...prev, newCourse as Course]);
      toast({
        title: "Sucesso",
        description: "Curso criado com sucesso!",
      });
      return { data: newCourse as Course, error: null };
    } catch (error: any) {
      console.error("Error creating course:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o curso.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateCourse = async (id: string, data: Partial<CreateCourseData>) => {
    try {
      const { data: updatedCourse, error } = await supabase
        .from("courses")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? (updatedCourse as Course) : c))
      );
      toast({
        title: "Sucesso",
        description: "Curso atualizado com sucesso!",
      });
      return { data: updatedCourse as Course, error: null };
    } catch (error: any) {
      console.error("Error updating course:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o curso.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      
      if (error) throw error;
      
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Sucesso",
        description: "Curso removido com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o curso.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [churchId]);

  return {
    courses,
    isLoading,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
}
