import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PhoneCall, ThumbsUp, MinusCircle, ThumbsDown, MessageSquareOff, Users, Eye } from "lucide-react";
import type { ConsolidationRecord } from "@/hooks/useConsolidation";

type EvaluationKey = "positiva" | "neutra" | "negativa" | "sem_resposta";
type MetricKey = "total" | "feitos" | "pendentes" | EvaluationKey;

interface Props {
  records: ConsolidationRecord[];
  // Members keyed by id (used as fallback for visitor names)
  membersById: Map<string, { full_name: string; phone?: string | null; email?: string | null }>;
  // Visitors (members.spiritual_status='visitante') already filtered for "current" stage
  visitors: Array<{ id: string; full_name: string; phone?: string | null; email?: string | null; created_at?: string }>;
  // Period filter from parent (Consolidacao)
  inPeriod: (dateStr?: string | null) => boolean;
}

interface PersonRow {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  contact_date?: string | null;
}

export function VisitorContactDashboard({ records, membersById, visitors, inPeriod }: Props) {
  const [openMetric, setOpenMetric] = useState<MetricKey | null>(null);

  const data = useMemo(() => {
    // Visitors of the period: based on visit_date OR member.created_at (if no record)
    const visitorRecords = records.filter(r => r.stage === "visitante");
    const recordByMember = new Map<string, ConsolidationRecord>();
    visitorRecords.forEach(r => recordByMember.set(r.member_id, r));

    // Build the list of "visitantes do período"
    const periodVisitors: PersonRow[] = visitors
      .filter(v => {
        const r = recordByMember.get(v.id);
        const ref = r?.visit_date || v.created_at?.split("T")[0];
        return inPeriod(ref);
      })
      .map(v => {
        const r = recordByMember.get(v.id);
        return {
          id: v.id,
          full_name: v.full_name,
          phone: v.phone,
          email: v.email,
          contact_date: r?.contact_date || null,
        };
      });

    const personOf = (r: ConsolidationRecord): PersonRow => {
      const m = membersById.get(r.member_id);
      return {
        id: r.member_id,
        full_name: r.member?.full_name || m?.full_name || "—",
        phone: r.member?.phone || m?.phone,
        email: r.member?.email || m?.email,
        contact_date: r.contact_date,
      };
    };

    const visitorRecsInPeriod = visitorRecords.filter(r => inPeriod(r.visit_date || r.created_at?.split("T")[0]));

    const feitos = visitorRecsInPeriod.filter(r => r.contact_made === true).map(personOf);
    const pendentesIds = new Set(visitorRecsInPeriod.filter(r => r.contact_made !== true).map(r => r.member_id));
    const pendentes: PersonRow[] = periodVisitors.filter(v => !feitos.find(f => f.id === v.id));

    const byEval = (key: EvaluationKey): PersonRow[] =>
      visitorRecsInPeriod.filter(r => r.contact_evaluation === key).map(personOf);

    return {
      total: periodVisitors,
      feitos,
      pendentes,
      positiva: byEval("positiva"),
      neutra: byEval("neutra"),
      negativa: byEval("negativa"),
      sem_resposta: byEval("sem_resposta"),
    };
  }, [records, membersById, visitors, inPeriod]);

  const counts: Record<MetricKey, number> = {
    total: data.total.length,
    feitos: data.feitos.length,
    pendentes: data.pendentes.length,
    positiva: data.positiva.length,
    neutra: data.neutra.length,
    negativa: data.negativa.length,
    sem_resposta: data.sem_resposta.length,
  };

  const taxa = counts.total > 0 ? Math.round((counts.feitos / counts.total) * 100) : 0;

  const cards: Array<{ key: MetricKey; label: string; value: number | string; icon: any; bg: string; fg: string }> = [
    { key: "total",        label: "Visitantes no período", value: counts.total,     icon: Eye,            bg: "bg-chart-visitante/10",    fg: "text-chart-visitante" },
    { key: "feitos",       label: `Contatos feitos (${taxa}%)`, value: counts.feitos, icon: PhoneCall,    bg: "bg-success/10",            fg: "text-success" },
    { key: "pendentes",    label: "Pendentes de contato",  value: counts.pendentes, icon: MessageSquareOff, bg: "bg-warning/10",         fg: "text-warning" },
  ];

  const evalCards: Array<{ key: EvaluationKey; label: string; icon: any; color: string }> = [
    { key: "positiva",     label: "Positiva",      icon: ThumbsUp,       color: "text-chart-decidido" },
    { key: "neutra",       label: "Neutra",        icon: MinusCircle,    color: "text-chart-consolidacao" },
    { key: "negativa",     label: "Negativa",      icon: ThumbsDown,     color: "text-destructive" },
    { key: "sem_resposta", label: "Sem resposta",  icon: MessageSquareOff, color: "text-muted-foreground" },
  ];

  const maxEval = Math.max(counts.positiva, counts.neutra, counts.negativa, counts.sem_resposta, 1);

  const labelFor = (k: MetricKey): string => {
    switch (k) {
      case "total": return "Visitantes no período";
      case "feitos": return "Contatos feitos";
      case "pendentes": return "Pendentes de contato";
      case "positiva": return "Avaliação positiva";
      case "neutra": return "Avaliação neutra";
      case "negativa": return "Avaliação negativa";
      case "sem_resposta": return "Sem resposta";
    }
  };

  const listFor = (k: MetricKey): PersonRow[] => (data as any)[k] as PersonRow[];

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Avaliação de Contato dos Visitantes</h2>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cards.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => setOpenMetric(c.key)}
              className="group rounded-xl border bg-card p-4 text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{c.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${c.bg} ${c.fg} shrink-0`}>
                  <c.icon className="w-5 h-5" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Evaluation distribution */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Distribuição das avaliações</p>
          <div className="space-y-2">
            {evalCards.map(e => {
              const value = counts[e.key];
              const pct = (value / maxEval) * 100;
              return (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setOpenMetric(e.key)}
                  className="w-full text-left cursor-pointer transition-transform hover:scale-[1.005] focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
                  aria-label={`Ver ${e.label}`}
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <e.icon className={`w-4 h-4 ${e.color}`} />
                      <span className="font-medium">{e.label}</span>
                    </span>
                    <span className="tabular-nums font-semibold">{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        e.key === "positiva" ? "bg-chart-decidido"
                        : e.key === "neutra" ? "bg-chart-consolidacao"
                        : e.key === "negativa" ? "bg-destructive"
                        : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${Math.max(pct, value > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Clique em uma métrica para ver as pessoas</p>
        </div>

        <Sheet open={!!openMetric} onOpenChange={(o) => !o && setOpenMetric(null)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            {openMetric && (() => {
              const list = listFor(openMetric);
              return (
                <>
                  <SheetHeader>
                    <SheetTitle>{labelFor(openMetric)}</SheetTitle>
                    <SheetDescription>{list.length} pessoa(s) no período</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 space-y-2">
                    {list.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <Users className="w-10 h-10 mb-2 opacity-40" />
                        <p className="text-sm">Ninguém nesta categoria</p>
                      </div>
                    ) : list.map(p => (
                      <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(p.full_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{p.full_name}</p>
                          {(p.phone || p.email) && (
                            <p className="text-xs text-muted-foreground truncate">{p.phone || p.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
