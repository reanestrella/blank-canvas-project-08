import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Reminder {
  id: string;
  church_id: string;
  member_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  reminder_type: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderData {
  member_id?: string;
  assigned_to?: string;
  due_date?: string;
  reminder_type?: string;
  title: string;
  description?: string;
}

export function useReminders(churchId?: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchReminders = async () => {
    if (!churchId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("church_id", churchId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      setReminders((data as Reminder[]) || []);
    } catch (error: any) {
      console.error("Error fetching reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createReminder = async (data: CreateReminderData) => {
    if (!churchId) return { data: null, error: new Error("No church") };
    try {
      const { data: newItem, error } = await supabase
        .from("reminders")
        .insert([{ ...data, church_id: churchId }])
        .select()
        .single();
      if (error) throw error;
      setReminders(prev => [newItem as Reminder, ...prev]);
      toast({ title: "Sucesso", description: "Lembrete criado!" });
      return { data: newItem as Reminder, error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { data: updated, error } = await supabase
        .from("reminders")
        .update({ 
          is_completed: completed, 
          completed_at: completed ? new Date().toISOString() : null 
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setReminders(prev => prev.map(r => r.id === id ? (updated as Reminder) : r));
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({ title: "Sucesso", description: "Lembrete removido!" });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  useEffect(() => { fetchReminders(); }, [churchId]);

  return { reminders, isLoading, createReminder, toggleComplete, deleteReminder, fetchReminders };
}
