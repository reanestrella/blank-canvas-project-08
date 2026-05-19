/**
 * Single source of truth for consolidation metrics.
 * Used by Dashboard cards, SpiritualFunnel, Consolidação page, exports.
 *
 * Rule: counts are based on the `stage` field of the most-recent
 * consolidation_record per member. Period filters apply to the relevant
 * date column for that stage (visit_date, decision_date,
 * consolidation_start_date, consolidation_end_date, baptism_date).
 */

export type ConsolidationStage =
  | "visitante"
  | "decidido"
  | "em_consolidacao"
  | "consolidado"
  | "batizado";

export interface ConsolidationRow {
  id: string;
  member_id: string;
  stage: ConsolidationStage | string;
  status?: string | null;
  visit_date?: string | null;
  decision_date?: string | null;
  consolidation_start_date?: string | null;
  consolidation_end_date?: string | null;
  baptism_date?: string | null;
  updated_at?: string;
  created_at?: string;
}

import { isRealVisitor, type OriginAware } from "./originType";

export interface MemberLite extends OriginAware {
  id: string;
  spiritual_status?: string | null;
  conversion_date?: string | null;
  baptism_date?: string | null;
  first_visit_date?: string | null;
  created_at?: string | null;
  is_active?: boolean;
  congregation_id?: string | null;
}

export interface MetricsFilters {
  congregationId?: string | null;
  periodMode?: "all" | "year" | "month" | "custom";
  filterMonth?: number; // 0-11
  filterYear?: number;
  /** Default true — exclude imported/migrated members from visitor counts. */
  ignoreImported?: boolean;
}

export interface ConsolidationMetrics {
  visitantes: number;       // pessoas que visitaram no período (preserva histórico)
  decididos: number;        // pessoas que decidiram no período
  emConsolidacao: number;   // pessoas com consolidação iniciada no período
  consolidados: number;     // consolidação finalizada no período
  batizados: number;        // batizados no período
  desistentes: number;      // status desistente
  visitanteIds: Set<string>;
  decididoIds: Set<string>;
  emConsolidacaoIds: Set<string>;
  consolidadoIds: Set<string>;
  batizadoIds: Set<string>;
}

const inPeriod = (
  dateStr: string | null | undefined,
  filters: MetricsFilters,
): boolean => {
  if (!dateStr) return false;
  const mode = filters.periodMode === "custom" ? "all" : (filters.periodMode || "all");
  if (mode === "all") return true;
  const d = new Date(dateStr.length === 10 ? dateStr + "T12:00:00" : dateStr);
  if (mode === "year") return d.getFullYear() === filters.filterYear;
  return (
    d.getFullYear() === filters.filterYear &&
    d.getMonth() === filters.filterMonth
  );
};

const passesCongregation = (
  m: MemberLite | undefined,
  congregationId?: string | null,
): boolean => {
  if (!congregationId) return true;
  if (!m) return true;
  if (!m.congregation_id) return true; // visível a todas
  return m.congregation_id === congregationId;
};

export function getConsolidationMetrics(
  records: ConsolidationRow[],
  members: MemberLite[],
  filters: MetricsFilters = {},
): ConsolidationMetrics {
  const memberById = new Map(members.map((m) => [m.id, m]));

  // Most recent record per member (drives current stage)
  const latestByMember = new Map<string, ConsolidationRow>();
  for (const r of records) {
    const prev = latestByMember.get(r.member_id);
    const ts = (r.updated_at || r.created_at || "") as string;
    const prevTs = (prev?.updated_at || prev?.created_at || "") as string;
    if (!prev || ts > prevTs) latestByMember.set(r.member_id, r);
  }

  const congregationId = filters.congregationId;
  const ignoreImported = filters.ignoreImported !== false; // default true

  // Visitantes (cumulativo): record.visit_date no período OU member.first_visit_date no período.
  // Filtro: por padrão exclui membros importados/migrados (origin_type não-real).
  const visitanteIds = new Set<string>();
  for (const r of records) {
    const m = memberById.get(r.member_id);
    if (!passesCongregation(m, congregationId)) continue;
    if (ignoreImported && !isRealVisitor(m)) continue;
    if (inPeriod(r.visit_date, filters)) visitanteIds.add(r.member_id);
  }
  for (const m of members) {
    if (!passesCongregation(m, congregationId)) continue;
    if (ignoreImported && !isRealVisitor(m)) continue;
    if (visitanteIds.has(m.id)) continue;
    if (inPeriod(m.first_visit_date, filters)) visitanteIds.add(m.id);
  }

  // Decididos: record.decision_date no período OU member.conversion_date no período
  const decididoIds = new Set<string>();
  for (const r of records) {
    const m = memberById.get(r.member_id);
    if (!passesCongregation(m, congregationId)) continue;
    if (inPeriod(r.decision_date, filters)) decididoIds.add(r.member_id);
  }
  for (const m of members) {
    if (!passesCongregation(m, congregationId)) continue;
    if (decididoIds.has(m.id)) continue;
    if (inPeriod(m.conversion_date, filters)) decididoIds.add(m.id);
  }

  // Em Consolidação: latest.stage = em_consolidacao + start_date no período (ou all)
  const emConsolidacaoIds = new Set<string>();
  for (const r of latestByMember.values()) {
    const m = memberById.get(r.member_id);
    if (!passesCongregation(m, congregationId)) continue;
    if (r.stage !== "em_consolidacao") continue;
    if (filters.periodMode === "all" || inPeriod(r.consolidation_start_date, filters)) {
      emConsolidacaoIds.add(r.member_id);
    }
  }

  // Consolidados: latest.stage = consolidado + end_date no período (ou all)
  const consolidadoIds = new Set<string>();
  for (const r of latestByMember.values()) {
    const m = memberById.get(r.member_id);
    if (!passesCongregation(m, congregationId)) continue;
    if (r.stage !== "consolidado" && r.stage !== "batizado") continue;
    if (filters.periodMode === "all" || inPeriod(r.consolidation_end_date, filters)) {
      consolidadoIds.add(r.member_id);
    }
  }

  // Batizados
  const batizadoIds = new Set<string>();
  for (const r of records) {
    const m = memberById.get(r.member_id);
    if (!passesCongregation(m, congregationId)) continue;
    if (inPeriod(r.baptism_date, filters)) batizadoIds.add(r.member_id);
  }
  for (const m of members) {
    if (!passesCongregation(m, congregationId)) continue;
    if (batizadoIds.has(m.id)) continue;
    if (inPeriod(m.baptism_date, filters)) batizadoIds.add(m.id);
  }

  const desistentes = Array.from(latestByMember.values()).filter(
    (r) => r.status === "desistente",
  ).length;

  return {
    visitantes: visitanteIds.size,
    decididos: decididoIds.size,
    emConsolidacao: emConsolidacaoIds.size,
    consolidados: consolidadoIds.size,
    batizados: batizadoIds.size,
    desistentes,
    visitanteIds,
    decididoIds,
    emConsolidacaoIds,
    consolidadoIds,
    batizadoIds,
  };
}
