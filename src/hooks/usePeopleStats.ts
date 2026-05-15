import { useMemo } from "react";

export interface PeopleStatsInput {
  id: string;
  spiritual_status: string;
  network: string | null;
  baptism_date: string | null;
  is_active: boolean;
  congregation_id?: string | null;
  created_at?: string;
  is_baptized?: boolean;
  first_visit_date?: string | null;
  conversion_date?: string | null;
}

export interface PeopleStats {
  total: number;
  membros: number;        // membro + lider + discipulador
  decididos: number;       // novo_convertido
  visitantes: number;
  batizados: number;
  inativos: number;
  networks: Record<string, number>;
  withoutNetwork: number;
  networkStats: { homens: number; mulheres: number; jovens: number; kids: number };
}

export interface PeopleStatsOptions {
  congregationId?: string | null;
  periodMode?: "all" | "year" | "month";
  filterMonth?: number;
  filterYear?: number;
}

const isMembro = (s: string) =>
  s === "membro" || s === "lider" || s === "discipulador";

/**
 * Unified people stats. Single source of truth used by Secretaria + Dashboard.
 * Filters: congregation (with null = visible to all), and optional period (created_at).
 */
export function usePeopleStats<T extends PeopleStatsInput>(
  members: T[],
  options: PeopleStatsOptions = {}
): PeopleStats {
  const { congregationId, periodMode = "all", filterMonth, filterYear } = options;

  return useMemo(() => {
    const filtered = members.filter((m) => {
      // Congregation: include null (acessível a todas) + match
      if (congregationId) {
        if (m.congregation_id && m.congregation_id !== congregationId) return false;
      }
      // Period filter on created_at
      if (periodMode !== "all" && m.created_at) {
        const d = new Date(m.created_at);
        if (periodMode === "year") {
          if (filterYear !== undefined && d.getFullYear() !== filterYear) return false;
        } else {
          if (filterYear !== undefined && d.getFullYear() !== filterYear) return false;
          if (filterMonth !== undefined && d.getMonth() !== filterMonth) return false;
        }
      }
      return true;
    });

    const active = filtered.filter((m) => m.is_active);
    const membrosForNetwork = active.filter((m) => isMembro(m.spiritual_status));

    const networks: Record<string, number> = {};
    const kidsCount = active.filter((m) => m.network === "kids").length;
    if (kidsCount > 0) networks["kids"] = kidsCount;
    membrosForNetwork.forEach((m) => {
      if (m.network && m.network !== "kids") {
        networks[m.network] = (networks[m.network] || 0) + 1;
      }
    });
    const withoutNetwork = membrosForNetwork.filter((m) => !m.network).length;

    return {
      total: active.length,
      membros: active.filter((m) => isMembro(m.spiritual_status)).length,
      decididos: active.filter((m) => m.spiritual_status === "novo_convertido").length,
      visitantes: active.filter((m) => m.spiritual_status === "visitante").length,
      batizados: active.filter((m) => m.is_baptized === true || m.baptism_date !== null).length,
      inativos: filtered.filter((m) => !m.is_active).length,
      networks,
      withoutNetwork,
      networkStats: {
        homens: membrosForNetwork.filter((m) => m.network === "homens").length,
        mulheres: membrosForNetwork.filter((m) => m.network === "mulheres").length,
        jovens: membrosForNetwork.filter((m) => m.network === "jovens").length,
        kids: kidsCount,
      },
    };
  }, [members, congregationId, periodMode, filterMonth, filterYear]);
}
