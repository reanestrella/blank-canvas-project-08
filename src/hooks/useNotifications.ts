import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  church_id: string;
  message: string | null;
  title?: string;
  alert_type: string;
  member_id?: string;
  member_name?: string;
  action_url?: string | null;
  is_read: boolean;
  created_at: string;
  source: "member_alerts" | "user_notifications";
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
      const [alertsRes, userNotifsRes] = await Promise.all([
        supabase
          .from("member_alerts")
          .select("*, members!member_alerts_member_id_fkey(full_name)")
          .eq("church_id", churchId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("user_notifications")
          .select("*")
          .eq("church_id", churchId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const memberAlerts: AppNotification[] = (alertsRes.data || []).map((row: any) => ({
        id: row.id,
        church_id: row.church_id,
        message: row.message,
        alert_type: row.alert_type,
        member_id: row.member_id,
        member_name: row.members?.full_name || "Membro",
        action_url: null,
        is_read: row.is_read ?? false,
        created_at: row.created_at,
        source: "member_alerts" as const,
      }));

      const userNotifs: AppNotification[] = (userNotifsRes.data || []).map((row: any) => ({
        id: row.id,
        church_id: row.church_id,
        message: row.message,
        title: row.title,
        alert_type: row.title,
        action_url: row.action_url,
        is_read: row.is_read ?? false,
        created_at: row.created_at,
        source: "user_notifications" as const,
      }));

      const merged = [...memberAlerts, ...userNotifs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(merged);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string, source: "member_alerts" | "user_notifications") => {
    const table = source === "user_notifications" ? "user_notifications" : "member_alerts";
    await supabase.from(table).update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!churchId) return;
    await Promise.all([
      supabase.from("member_alerts").update({ is_read: true }).eq("church_id", churchId).eq("is_read", false),
      supabase.from("user_notifications").update({ is_read: true }).eq("church_id", churchId).eq("is_read", false),
    ]);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  useEffect(() => {
    fetchNotifications();
  }, [churchId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, fetchNotifications };
}
