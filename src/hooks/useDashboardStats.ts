import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalMembers: number;
  totalDecididos: number;
  totalVisitantes: number;
  totalBaptized: number;
  totalConsolidacao: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const { currentChurchId } = useAuth();

  useEffect(() => {
    // Keep isLoading=true until we have a valid churchId and fetch completes
    if (!currentChurchId) {
      // Only clear data if we previously fetched (avoids flash of zeros on first load)
      if (hasFetched) {
        setMembers([]);
        setAlerts([]);
        setConsolidationCount(0);
        setHasFetched(false);
      }
      // Don't set isLoading=false here — auth may still be resolving
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch ALL members — same table and no is_active filter at query level
        // so we can filter client-side exactly like Secretaria does (line 106 of Secretaria.tsx)
        let membersQuery = supabase
          .from("members")
          .select("id, full_name, birth_date, wedding_date, spiritual_status, network, gender, congregation_id, photo_url, baptism_date, is_active")
          .eq("church_id", currentChurchId)
          .order("full_name")
          .limit(5000);
        
        if (congregationId) {
          // Include members assigned to this congregation OR members with no congregation assigned
          membersQuery = membersQuery.or(`congregation_id.eq.${congregationId},congregation_id.is.null`);
        }
        
        const [membersRes, alertsRes, consolRes] = await Promise.all([
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
            .in("status", ["contato", "acompanhamento", "integracao"]),
        ]);

        if (cancelled) return;

        // DIAGNOSTIC: Log errors if any
        if (membersRes.error) {
          console.error("[Dashboard] Members query ERROR:", membersRes.error);
        }

        const fetchedMembers = (membersRes.data as Member[]) || [];
        setMembers(fetchedMembers);
        setAlerts((alertsRes.data as Alert[]) || []);
        setConsolidationCount(consolRes.count || 0);
        setHasFetched(true);

        // Debug info for UI display
        const active = fetchedMembers.filter(m => m.is_active);
        const diag = {
          currentChurchId,
          totalMembersFetched: fetchedMembers.length,
          membersError: membersRes.error?.message || null,
          membrosCount: active.filter(m => m.spiritual_status === "membro" || m.spiritual_status === "lider" || m.spiritual_status === "discipulador").length,
          decididosCount: active.filter(m => m.spiritual_status === "novo_convertido").length,
          visitantesCount: active.filter(m => m.spiritual_status === "visitante").length,
          batizadosCount: active.filter(m => m.baptism_date !== null).length,
          consolidacaoCount: consolRes.count || 0,
          redes: {
            homens: active.filter(m => m.network === "homens").length,
            mulheres: active.filter(m => m.network === "mulheres").length,
            jovens: active.filter(m => m.network === "jovens").length,
            kids: active.filter(m => m.network === "kids").length,
          },
        };
        setDebugInfo(diag);
        console.log("[Dashboard Stats DEBUG]", diag);
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

    // Filter active members EXACTLY like Secretaria does (line 106 of Secretaria.tsx)
    const activeMembers = members.filter(m => m.is_active);

    // Match Secretaria exactly (lines 109-116 of Secretaria.tsx)
    const totalMembers = activeMembers.filter(m => 
      m.spiritual_status === "membro" || m.spiritual_status === "lider" || 
      m.spiritual_status === "discipulador"
    ).length;
    const totalDecididos = activeMembers.filter(m => m.spiritual_status === "novo_convertido").length;
    const totalVisitantes = activeMembers.filter(m => m.spiritual_status === "visitante").length;
    const totalBaptized = activeMembers.filter(m => m.baptism_date !== null).length;

    // Network stats - count only "membros" (membro/lider/discipulador) to match Secretaria
    const membrosForNetwork = activeMembers.filter(m =>
      m.spiritual_status === "membro" || m.spiritual_status === "lider" || m.spiritual_status === "discipulador"
    );
    const networkStats = {
      homens: membrosForNetwork.filter(m => m.network === "homens").length,
      mulheres: membrosForNetwork.filter(m => m.network === "mulheres").length,
      jovens: membrosForNetwork.filter(m => m.network === "jovens").length,
      kids: membrosForNetwork.filter(m => m.network === "kids").length,
    };

    // Birthday calculations
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
      networkStats,
      birthdaysThisMonth,
      birthdaysThisWeek,
      weddingAnniversariesThisMonth,
      weddingAnniversariesThisWeek,
      recentAlerts: alerts,
    };
  }, [members, alerts, consolidationCount]);

  return {
    stats,
    isLoading,
    members,
    debugInfo,
  };
}
