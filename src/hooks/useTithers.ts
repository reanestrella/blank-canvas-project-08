import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths } from "date-fns";

export interface TitherData {
  member_id: string;
  member_name: string;
  month: string;
  total: number;
}

export interface TitherSummary {
  member_id: string;
  member_name: string;
  total_year: number;
  months_paid: number;
  monthly_data: Record<string, number>;
}

export function useTithers(churchId?: string) {
  const [rawData, setRawData] = useState<TitherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTithers = async () => {
    if (!churchId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch ALL tithe transactions (not just last 12 months) so we can filter by any period
      const startDate = "2000-01-01";

      const { data, error } = await supabase
        .from("financial_transactions")
        .select(`
          id,
          amount,
          transaction_date,
          member_id,
          category:financial_categories!inner(name),
          member:members(full_name)
        `)
        .eq("church_id", churchId)
        .eq("type", "receita")
        .gte("transaction_date", startDate)
        .not("member_id", "is", null);

      if (error) throw error;

      // Filter only tithes (Dízimo/Dízimos/Dizimo/Dizimos category - case insensitive)
      const tithes = (data || []).filter(
        (tx: any) => {
          const normalized = tx.category?.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/s$/, "");
          return normalized === "dizimo";
        }
      );

      // Transform data - parse date as local to avoid timezone issues
      const transformed: TitherData[] = tithes.map((tx: any) => {
        // Parse date as local (YYYY-MM-DD format) - avoid UTC conversion
        const parts = tx.transaction_date.split('-');
        const year = parts[0];
        const month = parts[1];
        return {
          member_id: tx.member_id,
          member_name: tx.member?.full_name || "Membro desconhecido",
          month: `${year}-${month}`,
          year: parseInt(year),
          monthNum: parseInt(month) - 1, // 0-indexed
          total: Number(tx.amount),
        };
      });

      setRawData(transformed);
    } catch (error) {
      console.error("Error fetching tithers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Aggregate data by member
  const tithers = useMemo(() => {
    const memberMap = new Map<string, TitherSummary>();

    rawData.forEach((item) => {
      if (!memberMap.has(item.member_id)) {
        memberMap.set(item.member_id, {
          member_id: item.member_id,
          member_name: item.member_name,
          total_year: 0,
          months_paid: 0,
          monthly_data: {},
        });
      }

      const member = memberMap.get(item.member_id)!;
      member.total_year += item.total;

      if (!member.monthly_data[item.month]) {
        member.monthly_data[item.month] = 0;
        member.months_paid++;
      }
      member.monthly_data[item.month] += item.total;
    });

    return Array.from(memberMap.values()).sort(
      (a, b) => b.total_year - a.total_year
    );
  }, [rawData]);

  // Get last 12 months for chart
  const months = useMemo(() => {
    const result: string[] = [];
    for (let i = 11; i >= 0; i--) {
      result.push(format(subMonths(new Date(), i), "yyyy-MM"));
    }
    return result;
  }, []);

  // Monthly totals for chart
  const monthlyTotals = useMemo(() => {
    return months.map((month) => {
      const total = rawData
        .filter((d) => d.month === month)
        .reduce((sum, d) => sum + d.total, 0);
      return {
        month,
        label: format(new Date(month + "-01"), "MMM"),
        total,
      };
    });
  }, [months, rawData]);

  // Stats
  const stats = useMemo(() => {
    const totalTithers = tithers.length;
    const totalAmount = tithers.reduce((sum, t) => sum + t.total_year, 0);
    const averagePerTither = totalTithers > 0 ? totalAmount / totalTithers : 0;
    const regularTithers = tithers.filter((t) => t.months_paid >= 3).length;

    return {
      totalTithers,
      totalAmount,
      averagePerTither,
      regularTithers,
    };
  }, [tithers]);

  useEffect(() => {
    fetchTithers();
  }, [churchId]);

  return {
    tithers,
    months,
    monthlyTotals,
    stats,
    isLoading,
    refetch: fetchTithers,
  };
}
