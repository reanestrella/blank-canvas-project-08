import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Event {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  max_participants: number | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  max_participants?: number;
  is_public?: boolean;
}

export function useEvents(churchId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      
      if (churchId) {
        query = query.eq("church_id", churchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setEvents((data as Event[]) || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (data: CreateEventData & { church_id: string }) => {
    try {
      const { data: newEvent, error } = await supabase
        .from("events")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      setEvents((prev) => [...prev, newEvent as Event]);
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });
      return { data: newEvent as Event, error: null };
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o evento.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateEvent = async (id: string, data: Partial<CreateEventData>) => {
    try {
      const { data: updatedEvent, error } = await supabase
        .from("events")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? (updatedEvent as Event) : e))
      );
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!",
      });
      return { data: updatedEvent as Event, error: null };
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o evento.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      
      if (error) throw error;
      
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({
        title: "Sucesso",
        description: "Evento removido com sucesso!",
      });
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o evento.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [churchId]);

  return {
    events,
    isLoading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
