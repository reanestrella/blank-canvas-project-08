import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalMembers: number;
  totalDecididos: number;
  totalVisitantes: number;
  totalBaptized: number;
  totalConsolidacao: number;
  totalConsolidados: number;
  totalDesistentes: number;
  networkStats: {
    homens: number;
    mulheres: number;
    jovens: number;
    kids: number;
  };
  birthdaysThisMonth: Member[];
  birthdaysThisWeek: Member[];
  weddingAnniversariesThisMonth: Member[];
  weddingAnniversariesThisWeek: Member[];
  recentAlerts: Alert[];
}

interface Member {
  id: string;
  full_name: string;
  birth_date: string | null;
  wedding_date: string | null;
  spiritual_status: string;
  network: string | null;
  gender: string | null;
  congregation_id: string | null;
  photo_url: string | null;
  baptism_date: string | null;
  is_active: boolean;
}

interface Alert {
  id: string;
  alert_type: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  member_id: string;
}

export function useDashboardStats(congregationId?: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [consolidationCount, setConsolidationCount] = useState(0);
  const [consolidadosCount, setConsolidadosCount] = useState(0);
  const [desistentesCount, setDesistentesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  
  const { currentChurchId } = useAuth();

  useEffect(() => {
    if (!currentChurchId) {
      if (hasFetched) {
        setMembers([]);
        setAlerts([]);
        setConsolidationCount(0);
        setConsolidadosCount(0);
        setDesistentesCount(0);
        setHasFetched(false);
      }
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        let membersQuery = supabase
          .from("members")
          .select("id, full_name, birth_date, wedding_date, spiritual_status, network, gender, congregation_id, photo_url, baptism_date, is_active")
          .eq("church_id", currentChurchId)
          .order("full_name")
          .limit(5000);
        
        if (congregationId) {
          membersQuery = membersQuery.or(`congregation_id.eq.${congregationId},congregation_id.is.null`);
        }
        
        const [membersRes, alertsRes, consolRes, consolidadosRes, desistentesRes] = await Promise.all([
          membersQuery,
          supabase
            .from("member_alerts")
            .select("*")
            .eq("church_id", currentChurchId)
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("consolidation_records")
            .select("id", { count: "exact", head: true })
            .eq("church_id", currentChurchId)
            .eq("status", "acompanhamento"),
          supabase
            .from("consolidation_records")
            .select("id", { count: "exact", head: true })
            .eq("church_id", currentChurchId)
            .eq("status", "concluido"),
          supabase
            .from("consolidation_records")
            .select("id", { count: "exact", head: true })
            .eq("church_id", currentChurchId)
            .eq("status", "desistente"),
        ]);

        if (cancelled) return;

        if (membersRes.error) {
          console.error("[Dashboard] Members query ERROR:", membersRes.error);
        }

        setMembers((membersRes.data as Member[]) || []);
        setAlerts((alertsRes.data as Alert[]) || []);
        setConsolidationCount(consolRes.count || 0);
        setConsolidadosCount(consolidadosRes.count || 0);
        setDesistentesCount(desistentesRes.count || 0);
        setHasFetched(true);

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [congregationId, currentChurchId]);

  const stats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const currentDay = now.getDay();
    
    const weekStart = new Date(now);
    weekStart.setDate(currentDate - currentDay);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const activeMembers = members.filter(m => m.is_active);

    const totalMembers = activeMembers.filter(m => 
      m.spiritual_status === "membro" || m.spiritual_status === "lider" || 
      m.spiritual_status === "discipulador"
    ).length;
    const totalDecididos = activeMembers.filter(m => m.spiritual_status === "novo_convertido").length;
    const totalVisitantes = activeMembers.filter(m => m.spiritual_status === "visitante").length;
    const totalBaptized = activeMembers.filter(m => m.baptism_date !== null).length;

    const membrosForNetwork = activeMembers.filter(m =>
      m.spiritual_status === "membro" || m.spiritual_status === "lider" || m.spiritual_status === "discipulador"
    );
    const networkStats = {
      homens: membrosForNetwork.filter(m => m.network === "homens").length,
      mulheres: membrosForNetwork.filter(m => m.network === "mulheres").length,
      jovens: membrosForNetwork.filter(m => m.network === "jovens").length,
      kids: membrosForNetwork.filter(m => m.network === "kids").length,
    };

    const birthdaysThisMonth = activeMembers.filter(m => {
      if (!m.birth_date) return false;
      const bd = new Date(m.birth_date + "T12:00:00");
      return bd.getMonth() === currentMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.birth_date! + "T12:00:00").getDate();
      const dayB = new Date(b.birth_date! + "T12:00:00").getDate();
      return dayA - dayB;
    });

    const birthdaysThisWeek = activeMembers.filter(m => {
      if (!m.birth_date) return false;
      const bd = new Date(m.birth_date + "T12:00:00");
      const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      return thisYearBd >= weekStart && thisYearBd <= weekEnd;
    });

    const weddingAnniversariesThisMonth = activeMembers.filter(m => {
      if (!m.wedding_date) return false;
      const wd = new Date(m.wedding_date + "T12:00:00");
      return wd.getMonth() === currentMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.wedding_date! + "T12:00:00").getDate();
      const dayB = new Date(b.wedding_date! + "T12:00:00").getDate();
      return dayA - dayB;
    });

    const weddingAnniversariesThisWeek = activeMembers.filter(m => {
      if (!m.wedding_date) return false;
      const wd = new Date(m.wedding_date + "T12:00:00");
      const thisYearWd = new Date(now.getFullYear(), wd.getMonth(), wd.getDate());
      return thisYearWd >= weekStart && thisYearWd <= weekEnd;
    });

    return {
      totalMembers,
      totalDecididos,
      totalVisitantes,
      totalBaptized,
      totalConsolidacao: consolidationCount,
      totalConsolidados: consolidadosCount,
      networkStats,
      birthdaysThisMonth,
      birthdaysThisWeek,
      weddingAnniversariesThisMonth,
      weddingAnniversariesThisWeek,
      recentAlerts: alerts,
    };
  }, [members, alerts, consolidationCount, consolidadosCount]);

  return {
    stats,
    isLoading,
    members,
  };
}
