import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalMembers: number;
  totalDecididos: number;
  totalVisitantes: number;
  totalBaptized: number;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let membersQuery = supabase
          .from("members")
          .select("id, full_name, birth_date, wedding_date, spiritual_status, network, gender, congregation_id, photo_url, baptism_date")
          .eq("is_active", true);
        
        if (congregationId) {
          membersQuery = membersQuery.eq("congregation_id", congregationId);
        }
        
        const { data: membersData } = await membersQuery;
        setMembers((membersData as Member[]) || []);

        const { data: alertsData } = await supabase
          .from("member_alerts")
          .select("*")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);
        
        setAlerts((alertsData as Alert[]) || []);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [congregationId]);

  const stats = useMemo<DashboardStats>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const currentDay = now.getDay();
    
    // Week boundaries (Sunday to Saturday)
    const weekStart = new Date(now);
    weekStart.setDate(currentDate - currentDay);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const totalMembers = members.filter(m => m.spiritual_status === "membro" || m.spiritual_status === "lider" || m.spiritual_status === "discipulador").length;
    const totalDecididos = members.filter(m => m.spiritual_status === "novo_convertido").length;
    const totalVisitantes = members.filter(m => m.spiritual_status === "visitante").length;
    const totalBaptized = members.filter(m => (m as any).baptism_date !== null).length;

    // Network stats
    const networkStats = {
      homens: members.filter(m => m.network === "homens" || (m.gender === "M" && !m.network)).length,
      mulheres: members.filter(m => m.network === "mulheres" || (m.gender === "F" && !m.network)).length,
      jovens: members.filter(m => m.network === "jovens").length,
      kids: members.filter(m => m.network === "kids").length,
    };

    // Birthday calculations
    const birthdaysThisMonth = members.filter(m => {
      if (!m.birth_date) return false;
      const bd = new Date(m.birth_date);
      return bd.getMonth() === currentMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.birth_date!).getDate();
      const dayB = new Date(b.birth_date!).getDate();
      return dayA - dayB;
    });

    const birthdaysThisWeek = members.filter(m => {
      if (!m.birth_date) return false;
      const bd = new Date(m.birth_date);
      const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      return thisYearBd >= weekStart && thisYearBd <= weekEnd;
    });

    // Wedding anniversary calculations
    const weddingAnniversariesThisMonth = members.filter(m => {
      if (!m.wedding_date) return false;
      const wd = new Date(m.wedding_date);
      return wd.getMonth() === currentMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.wedding_date!).getDate();
      const dayB = new Date(b.wedding_date!).getDate();
      return dayA - dayB;
    });

    const weddingAnniversariesThisWeek = members.filter(m => {
      if (!m.wedding_date) return false;
      const wd = new Date(m.wedding_date);
      const thisYearWd = new Date(now.getFullYear(), wd.getMonth(), wd.getDate());
      return thisYearWd >= weekStart && thisYearWd <= weekEnd;
    });

    return {
      totalMembers,
      totalDecididos,
      totalVisitantes,
      totalBaptized,
      networkStats,
      birthdaysThisMonth,
      birthdaysThisWeek,
      weddingAnniversariesThisMonth,
      weddingAnniversariesThisWeek,
      recentAlerts: alerts,
    };
  }, [members, alerts]);

  return {
    stats,
    isLoading,
    members,
  };
}
