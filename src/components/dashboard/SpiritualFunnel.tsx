import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowDown, Users } from "lucide-react";
import { FinancialFilters, PeriodMode } from "@/components/financial/FinancialFilters";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getConsolidationMetrics } from "@/lib/consolidationMetrics";
import { useMetricsSettings } from "@/hooks/useMetricsSettings";

type StageKey = "visitante" | "decidido" | "consolidacao" | "batizado" | "membro";

interface Row {
  id: string;
  member_id: string;
  stage: string;
  visit_date: string | null;
  decision_date: string | null;
  consolidation_start_date: string | null;
  consolidation_end_date: string | null;
  baptism_date: string | null;
  member?: { full_name: string; phone?: string | null; email?: string | null } | null;
}

const stageMeta: Record<StageKey, { label: string; barClass: string; gradient: string }> = {
  visitante:    { label: "Visitantes",      barClass: "bg-chart-visitante",    gradient: "from-chart-visitante/20 to-chart-visitante/5" },
  decidido:     { label: "Decididos",       barClass: "bg-chart-decidido",     gradient: "from-chart-decidido/20 to-chart-decidido/5" },
  consolidacao: { label: "Em Consolidação", barClass: "bg-chart-consolidacao", gradient: "from-chart-consolidacao/20 to-chart-consolidacao/5" },
  batizado:     { label: "Batizados",       barClass: "bg-chart-batizado",     gradient: "from-chart-batizado/20 to-chart-batizado/5" },
  membro:       { label: "Membros",         barClass: "bg-chart-membro",       gradient: "from-chart-membro/20 to-chart-membro/5" },
};

export function SpiritualFunnel() {
  const { currentChurchId } = useAuth();
  const now = new Date();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const [records, setRecords] = useState<Row[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openStage, setOpenStage] = useState<StageKey | null>(null);

  useEffect(() => {
    if (!currentChurchId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const [r, m] = await Promise.all([
        supabase
          .from("consolidation_records")
          .select("id, member_id, stage, visit_date, decision_date, consolidation_start_date, consolidation_end_date, baptism_date, member:members!consolidation_records_member_id_fkey(full_name, phone, email)")
          .eq("church_id", currentChurchId)
          .limit(5000),
        supabase
          .from("members")
          .select("id, full_name, spiritual_status, baptism_date, conversion_date, first_visit_date, congregation_id, is_active, created_at, phone, email")
          .eq("church_id", currentChurchId)
          .limit(5000),
      ]);
      if (cancelled) return;
      setRecords(((r.data as any[]) || []).map(x => ({ ...x, member: Array.isArray(x.member) ? x.member[0] : x.member })) as Row[]);
      setMembers(m.data || []);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentChurchId]);

  const inPeriod = (dateStr?: string | null) => {
    if (!dateStr) return false;
    if (periodMode === "all") return true;
    const d = new Date(dateStr.length === 10 ? dateStr + "T12:00:00" : dateStr);
    if (periodMode === "year") return d.getFullYear() === filterYear;
    return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
  };

  const stagePeople = useMemo(() => {
    const memberById = new Map(members.map(m => [m.id, m]));

    // Fonte única — mesma função usada pelo Dashboard e página /consolidacao
    const metrics = getConsolidationMetrics(records as any, members as any, {
      periodMode,
      filterMonth,
      filterYear,
      ignoreImported,
    });

    const personFor = (memberId: string) => {
      const m = memberById.get(memberId);
      const r = records.find(x => x.member_id === memberId);
      return m || { id: memberId, full_name: r?.member?.full_name, phone: r?.member?.phone, email: r?.member?.email };
    };

    return {
      visitante: Array.from(metrics.visitanteIds).map(personFor),
      decidido: Array.from(metrics.decididoIds).map(personFor),
      consolidacao: Array.from(metrics.emConsolidacaoIds).map(personFor),
      batizado: Array.from(metrics.batizadoIds).map(personFor),
      membro: members.filter(m => {
        if (!m.is_active) return false;
        const isMembro = m.spiritual_status === "membro" || m.spiritual_status === "lider" || m.spiritual_status === "discipulador";
        if (!isMembro) return false;
        if (periodMode === "all") return true;
        const r = records.find(x => x.member_id === m.id);
        const inPeriodCheck = (s?: string | null) => {
          if (!s) return false;
          const d = new Date(s.length === 10 ? s + "T12:00:00" : s);
          if (periodMode === "year") return d.getFullYear() === filterYear;
          return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
        };
        return inPeriodCheck(r?.consolidation_end_date) || inPeriodCheck(m.baptism_date);
      }),
    };
  }, [records, members, periodMode, filterMonth, filterYear]);

  const steps: StageKey[] = ["visitante", "decidido", "consolidacao", "batizado", "membro"];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const total = steps.reduce((s, k) => s + stagePeople[k].length, 0);
  const maxVal = Math.max(...steps.map(k => stagePeople[k].length), 1);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Funil Espiritual</CardTitle>
            <FinancialFilters
              mode={periodMode}
              month={filterMonth}
              year={filterYear}
              onModeChange={setPeriodMode}
              onMonthChange={setFilterMonth}
              onYearChange={setFilterYear}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((key, i) => {
              const meta = stageMeta[key];
              const value = stagePeople[key].length;
              const pct = (value / maxVal) * 100;
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenStage(key)}
                    className="w-full text-left cursor-pointer transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring rounded-xl"
                    aria-label={`Ver ${meta.label}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{meta.label}</span>
                      <span className="tabular-nums font-semibold">{value}</span>
                    </div>
                    <div className={cn("h-9 overflow-hidden rounded-xl bg-gradient-to-r", meta.gradient)}>
                      <div
                        className={cn("flex h-full items-center justify-center rounded-xl transition-all duration-700", meta.barClass)}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-xs font-bold text-white drop-shadow-sm">{value}</span>
                      </div>
                    </div>
                  </button>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {total === 0 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Nenhum resultado encontrado para o período selecionado.
            </p>
          ) : (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Clique em uma etapa para ver as pessoas
            </p>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!openStage} onOpenChange={(o) => !o && setOpenStage(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {openStage && (
            <>
              <SheetHeader>
                <SheetTitle>{stageMeta[openStage].label}</SheetTitle>
                <SheetDescription>
                  {stagePeople[openStage].length} pessoa(s) no período
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {stagePeople[openStage].length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">Ninguém nesta etapa</p>
                  </div>
                ) : (
                  stagePeople[openStage].map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(p.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{p.full_name || "—"}</p>
                        {(p.phone || p.email) && (
                          <p className="text-xs text-muted-foreground truncate">{p.phone || p.email}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
