import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KidsSuggestion {
  text: string;
  type?: string; // dinamica, material, atividade, versiculo, dica
}

export interface KidsStudy {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  age_group: string | null;
  study_date: string | null;
  file_url: string | null;
  suggestions: KidsSuggestion[];
  created_by_member_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudyData {
  title: string;
  description?: string;
  age_group?: string;
  study_date?: string;
  file_url?: string;
  suggestions?: KidsSuggestion[];
  created_by_member_id?: string;
}

export function useKidsStudies(churchId?: string) {
  const [studies, setStudies] = useState<KidsStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudies = useCallback(async () => {
    if (!churchId) { setStudies([]); setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("kids_studies" as any)
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const parsed = ((data as any[]) || []).map((d: any) => ({
        ...d,
        suggestions: Array.isArray(d.suggestions) ? d.suggestions : [],
      }));
      setStudies(parsed);
    } catch (err: any) {
      console.error("Error fetching kids studies:", err);
    } finally {
      setIsLoading(false);
    }
  }, [churchId]);

  useEffect(() => { fetchStudies(); }, [fetchStudies]);

  const createStudy = async (data: CreateStudyData) => {
    if (!churchId) return { data: null, error: new Error("No church") };
    try {
      const { data: newStudy, error } = await supabase
        .from("kids_studies" as any)
        .insert([{
          ...data,
          church_id: churchId,
          suggestions: data.suggestions || [],
        }] as any)
        .select()
        .single();
      if (error) throw error;
      const parsed = { ...(newStudy as any), suggestions: Array.isArray((newStudy as any).suggestions) ? (newStudy as any).suggestions : [] };
      setStudies(prev => [parsed, ...prev]);
      toast({ title: "Estudo criado com sucesso!" });
      return { data: parsed, error: null };
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return { data: null, error: err };
    }
  };

  const updateStudy = async (id: string, data: Partial<CreateStudyData>) => {
    try {
      const payload: any = { ...data, updated_at: new Date().toISOString() };
      const { data: updated, error } = await supabase
        .from("kids_studies" as any)
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const parsed = { ...(updated as any), suggestions: Array.isArray((updated as any).suggestions) ? (updated as any).suggestions : [] };
      setStudies(prev => prev.map(s => s.id === id ? parsed : s));
      toast({ title: "Estudo atualizado!" });
      return { data: parsed, error: null };
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return { data: null, error: err };
    }
  };

  const deleteStudy = async (id: string) => {
    try {
      const { error } = await supabase
        .from("kids_studies" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      setStudies(prev => prev.filter(s => s.id !== id));
      toast({ title: "Estudo removido!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!churchId) return null;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Tipo inválido", description: "Apenas PDF, DOC, DOCX, PPT e PPTX são permitidos.", variant: "destructive" });
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo grande demais", description: "Máximo de 10MB.", variant: "destructive" });
      return null;
    }

    const ext = file.name.split(".").pop() || "pdf";
    const path = `${churchId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const { error } = await supabase.storage.from("kids-studies").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("kids-studies").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
      return null;
    }
  };

  return { studies, isLoading, fetchStudies, createStudy, updateStudy, deleteStudy, uploadFile };
}
