import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingOffering {
  id: string;
  report_date: string;
  offering: number;
  oferta_status: string;
  cell_name: string;
  leader_name: string | null;
}

interface Props {
  churchId: string;
}

export function OfertasCelulasTab({ churchId }: Props) {
  const [items, setItems] = useState<PendingOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const { data: reports, error } = await supabase
      .from("cell_reports")
      .select("id, report_date, offering, oferta_status, cell_id, created_by, cells ( name )")
      .eq("church_id", churchId)
      .eq("oferta_status", "pendente")
      .gt("offering", 0)
      .order("report_date", { ascending: false });

    if (error) {
      toast({ title: "Erro ao buscar ofertas", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch creator names via profiles.user_id
    const creatorIds = [...new Set((reports ?? []).map((r: any) => r.created_by).filter(Boolean))];
    const profileMap = new Map<string, string>();
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", creatorIds);
      (profiles ?? []).forEach((p: any) => profileMap.set(p.user_id, p.full_name));
    }

    setItems(
      (reports ?? []).map((r: any) => ({
        id: r.id,
        report_date: r.report_date,
        offering: Number(r.offering),
        oferta_status: r.oferta_status,
        cell_name: (r.cells as any)?.name ?? "—",
        leader_name: r.created_by ? (profileMap.get(r.created_by) ?? null) : null,
      }))
    );
    setLoading(false);
  }, [churchId, toast]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (id: string, acao: "confirmar" | "rejeitar") => {
    setProcessing(id);
    const { data, error } = await supabase.rpc("confirmar_oferta_celula", {
      p_relatorio_id: id,
      p_acao: acao,
    });

    if (error || (data as any)?.error) {
      toast({
        title: "Erro",
        description: error?.message ?? (data as any)?.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: acao === "confirmar" ? "Oferta confirmada" : "Oferta rejeitada",
        description: acao === "confirmar"
          ? "O valor foi lançado no financeiro."
          : "A oferta foi descartada.",
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
    setProcessing(null);
  };

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Ofertas de Células Pendentes
          {items.length > 0 && (
            <Badge variant="secondary">{items.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
            <Inbox className="w-10 h-10" />
            <p className="font-medium">Nenhuma oferta aguardando confirmação</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card"
              >
                <div className="space-y-0.5">
                  <p className="font-medium">{item.cell_name}</p>
                  {item.leader_name && (
                    <p className="text-sm text-muted-foreground">Líder: {item.leader_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Data: {fmtDate(item.report_date)}</p>
                  <p className="text-base font-semibold text-success">
                    R$ {item.offering.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={processing === item.id}
                    onClick={() => handleAction(item.id, "rejeitar")}
                  >
                    {processing === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-1" />
                    )}
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    disabled={processing === item.id}
                    onClick={() => handleAction(item.id, "confirmar")}
                  >
                    {processing === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Confirmar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
