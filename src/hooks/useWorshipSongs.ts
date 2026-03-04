import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WorshipSong {
  id: string;
  church_id: string;
  title: string;
  artist: string | null;
  key_signature: string | null;
  bpm: number | null;
  tags: string[];
  chord_url: string | null;
  audio_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WorshipSet {
  id: string;
  church_id: string;
  ministry_id: string;
  date: string;
  title: string;
  created_by_member_id: string | null;
  created_at: string;
}

export interface WorshipSetSong {
  id: string;
  church_id: string;
  worship_set_id: string;
  song_id: string;
  order_index: number;
  played_key_override: string | null;
  notes: string | null;
  created_at: string;
  song?: WorshipSong;
}

export interface SongStats {
  song_id: string;
  title: string;
  artist: string | null;
  key_signature: string | null;
  played_month: number;
  played_year: number;
  played_total: number;
}

export function useWorshipSongs(churchId?: string) {
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSongs = useCallback(async () => {
    if (!churchId) { setSongs([]); setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("worship_songs" as any)
        .select("*")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      setSongs((data as any[]) || []);
    } catch (err: any) {
      console.error("Error fetching songs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [churchId]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const createSong = async (data: Partial<WorshipSong>) => {
    if (!churchId) return { data: null, error: new Error("No church") };
    try {
      const { data: newSong, error } = await supabase
        .from("worship_songs" as any)
        .insert([{ ...data, church_id: churchId }] as any)
        .select()
        .single();
      if (error) throw error;
      setSongs(prev => [...prev, newSong as any]);
      toast({ title: "Música adicionada!" });
      return { data: newSong, error: null };
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return { data: null, error: err };
    }
  };

  const updateSong = async (id: string, data: Partial<WorshipSong>) => {
    try {
      const { data: updated, error } = await supabase
        .from("worship_songs" as any)
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setSongs(prev => prev.map(s => s.id === id ? (updated as any) : s));
      toast({ title: "Música atualizada!" });
      return { data: updated, error: null };
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return { data: null, error: err };
    }
  };

  const deleteSong = async (id: string) => {
    try {
      const { error } = await supabase
        .from("worship_songs" as any)
        .update({ is_active: false } as any)
        .eq("id", id);
      if (error) throw error;
      setSongs(prev => prev.filter(s => s.id !== id));
      toast({ title: "Música removida!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return { songs, isLoading, fetchSongs, createSong, updateSong, deleteSong };
}

export function useWorshipSets(churchId?: string, ministryId?: string) {
  const [sets, setSets] = useState<WorshipSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSets = useCallback(async () => {
    if (!churchId || !ministryId) { setSets([]); setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("worship_sets" as any)
        .select("*")
        .eq("church_id", churchId)
        .eq("ministry_id", ministryId)
        .order("date", { ascending: false });
      if (error) throw error;
      setSets((data as any[]) || []);
    } catch (err: any) {
      console.error("Error fetching sets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [churchId, ministryId]);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  const createSet = async (data: { date: string; title: string; created_by_member_id?: string }) => {
    if (!churchId || !ministryId) return { data: null, error: new Error("No church/ministry") };
    try {
      const { data: newSet, error } = await supabase
        .from("worship_sets" as any)
        .insert([{ ...data, church_id: churchId, ministry_id: ministryId }] as any)
        .select()
        .single();
      if (error) throw error;
      setSets(prev => [newSet as any, ...prev]);
      toast({ title: "Culto/Ensaio criado!" });
      return { data: newSet, error: null };
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return { data: null, error: err };
    }
  };

  const deleteSet = async (id: string) => {
    try {
      const { error } = await supabase.from("worship_sets" as any).delete().eq("id", id);
      if (error) throw error;
      setSets(prev => prev.filter(s => s.id !== id));
      toast({ title: "Culto removido!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return { sets, isLoading, fetchSets, createSet, deleteSet };
}

export function useWorshipSetSongs(setId?: string, churchId?: string) {
  const [setSongs, setSetSongs] = useState<WorshipSetSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSetSongs = useCallback(async () => {
    if (!setId || !churchId) { setSetSongs([]); return; }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("worship_set_songs" as any)
        .select("*, song:worship_songs(*)")
        .eq("worship_set_id", setId)
        .eq("church_id", churchId)
        .order("order_index");
      if (error) throw error;
      setSetSongs((data as any[]) || []);
    } catch (err: any) {
      console.error("Error fetching set songs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [setId, churchId]);

  useEffect(() => { fetchSetSongs(); }, [fetchSetSongs]);

  const addSongToSet = async (songId: string, orderIndex: number, playedKeyOverride?: string) => {
    if (!setId || !churchId) return;
    try {
      const { data, error } = await supabase
        .from("worship_set_songs" as any)
        .insert([{
          worship_set_id: setId,
          song_id: songId,
          church_id: churchId,
          order_index: orderIndex,
          played_key_override: playedKeyOverride || null,
        }] as any)
        .select("*, song:worship_songs(*)")
        .single();
      if (error) throw error;
      setSetSongs(prev => [...prev, data as any]);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const removeSongFromSet = async (id: string) => {
    try {
      const { error } = await supabase.from("worship_set_songs" as any).delete().eq("id", id);
      if (error) throw error;
      setSetSongs(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return { setSongs, isLoading, fetchSetSongs, addSongToSet, removeSongFromSet };
}

export function useWorshipStats(churchId?: string) {
  const [stats, setStats] = useState<SongStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!churchId) { setStats([]); setIsLoading(false); return; }
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const currentYear = `${now.getFullYear()}`;

        // Get all set songs with their sets and songs
        const { data, error } = await supabase
          .from("worship_set_songs" as any)
          .select("song_id, worship_set:worship_sets(date), song:worship_songs(title, artist, key_signature)")
          .eq("church_id", churchId);
        if (error) throw error;

        const songMap = new Map<string, SongStats>();
        ((data as any[]) || []).forEach((row: any) => {
          const songId = row.song_id;
          const setDate = row.worship_set?.date || "";
          if (!songMap.has(songId)) {
            songMap.set(songId, {
              song_id: songId,
              title: row.song?.title || "?",
              artist: row.song?.artist || null,
              key_signature: row.song?.key_signature || null,
              played_month: 0,
              played_year: 0,
              played_total: 0,
            });
          }
          const s = songMap.get(songId)!;
          s.played_total++;
          if (setDate.startsWith(currentMonth)) s.played_month++;
          if (setDate.startsWith(currentYear)) s.played_year++;
        });

        const result = Array.from(songMap.values()).sort((a, b) => b.played_total - a.played_total);
        setStats(result);
      } catch (err) {
        console.error("Error fetching worship stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [churchId]);

  return { stats, isLoading };
}
