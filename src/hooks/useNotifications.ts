import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  church_id: string;
  message: string | null;
  alert_type: string;
  member_id: string;
  member_name?: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(churchId?: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!churchId) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("member_alerts")
        .select("*, members!member_alerts_member_id_fkey(full_name)")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped: AppNotification[] = (data || []).map((row: any) => ({
        id: row.id,
        church_id: row.church_id,
        message: row.message,
        alert_type: row.alert_type,
        member_id: row.member_id,
        member_name: row.members?.full_name || "Membro",
        is_read: row.is_read ?? false,
        created_at: row.created_at,
      }));

      setNotifications(mapped);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from("member_alerts").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!churchId) return;
    await supabase
      .from("member_alerts")
      .update({ is_read: true })
      .eq("church_id", churchId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  useEffect(() => {
    fetchNotifications();
  }, [churchId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, fetchNotifications };
}
