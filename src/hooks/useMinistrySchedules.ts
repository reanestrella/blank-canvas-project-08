import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ScheduleVolunteerWithMember {
  id: string;
  confirmed: boolean | null;
  role: string | null;
  member: {
    id: string;
    full_name: string;
  } | null;
}

export interface MinistrySchedule {
  id: string;
  ministry_id: string;
  event_name: string;
  event_date: string;
  notes: string | null;
  created_at: string;
  volunteers?: ScheduleVolunteerWithMember[];
}

export interface ScheduleVolunteer {
  id: string;
  schedule_id: string;
  member_id: string;
  role: string | null;
  confirmed: boolean | null;
  member?: {
    id: string;
    full_name: string;
  };
}

export interface CreateScheduleData {
  event_name: string;
  event_date: string;
  notes?: string;
}

export function useMinistrySchedules(ministryId?: string) {
  const [schedules, setSchedules] = useState<MinistrySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("ministry_schedules")
        .select(`
          *,
          volunteers:schedule_volunteers(
            id,
            confirmed,
            role,
            member:members(id, full_name)
          )
        `)
        .order("event_date", { ascending: true });

      // If ministryId is provided, filter by it
      if (ministryId) {
        query = query.eq("ministry_id", ministryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      console.error("Error fetching schedules:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as escalas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async (data: CreateScheduleData) => {
    if (!ministryId) return { data: null, error: new Error("Ministry ID required") };

    try {
      const { data: newSchedule, error } = await supabase
        .from("ministry_schedules")
        .insert([{ ...data, ministry_id: ministryId }])
        .select()
        .single();

      if (error) throw error;

      setSchedules((prev) => [...prev, newSchedule].sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      ));
      toast({
        title: "Sucesso",
        description: "Escala criada com sucesso!",
      });
      return { data: newSchedule, error: null };
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a escala.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateSchedule = async (id: string, data: Partial<CreateScheduleData>) => {
    try {
      const { data: updated, error } = await supabase
        .from("ministry_schedules")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      );
      toast({
        title: "Sucesso",
        description: "Escala atualizada com sucesso!",
      });
      return { data: updated, error: null };
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a escala.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ministry_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Sucesso",
        description: "Escala removida com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a escala.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [ministryId]);

  return {
    schedules,
    isLoading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}

export function useScheduleVolunteers(scheduleId?: string) {
  const [volunteers, setVolunteers] = useState<ScheduleVolunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchVolunteers = async () => {
    if (!scheduleId) {
      setVolunteers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("schedule_volunteers")
        .select(`
          *,
          member:members(id, full_name)
        `)
        .eq("schedule_id", scheduleId);

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error: any) {
      console.error("Error fetching schedule volunteers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addVolunteer = async (memberId: string, role?: string) => {
    if (!scheduleId) return { error: new Error("Schedule ID required") };

    try {
      const { data, error } = await supabase
        .from("schedule_volunteers")
        .insert([{ schedule_id: scheduleId, member_id: memberId, role }])
        .select(`
          *,
          member:members(id, full_name)
        `)
        .single();

      if (error) throw error;

      setVolunteers((prev) => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Voluntário escalado com sucesso!",
      });
      return { data, error: null };
    } catch (error: any) {
      console.error("Error adding schedule volunteer:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível escalar o voluntário.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const removeVolunteer = async (volunteerId: string) => {
    try {
      const { error } = await supabase
        .from("schedule_volunteers")
        .delete()
        .eq("id", volunteerId);

      if (error) throw error;

      setVolunteers((prev) => prev.filter((v) => v.id !== volunteerId));
      toast({
        title: "Sucesso",
        description: "Voluntário removido da escala!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error removing schedule volunteer:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o voluntário.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const toggleConfirmation = async (volunteerId: string, confirmed: boolean) => {
    try {
      const { error } = await supabase
        .from("schedule_volunteers")
        .update({ confirmed })
        .eq("id", volunteerId);

      if (error) throw error;

      setVolunteers((prev) =>
        prev.map((v) => (v.id === volunteerId ? { ...v, confirmed } : v))
      );
      return { error: null };
    } catch (error: any) {
      console.error("Error toggling confirmation:", error);
      return { error };
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, [scheduleId]);

  return {
    volunteers,
    isLoading,
    fetchVolunteers,
    addVolunteer,
    removeVolunteer,
    toggleConfirmation,
  };
}
