import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Gift, DollarSign, Building2, Clock, AlertTriangle, RefreshCw, Calendar } from "lucide-react";

interface SubRow {
  id: string;
  church_id: string;
  plan: string | null;
  status: string | null;
  trial: boolean | null;
  trial_ends_at: string | null;
  due_date: string | null;
  is_gift: boolean | null;
  provider: string | null;
  payment_method: string | null;
  current_period_end: string | null;
  updated_at: string | null;
  church_name?: string;
  last_payment?: string | null;
}

const PLAN_VALUES: Record<string, number> = { mensal: 79.9, anual: 790 };

export function SubscriptionsTab({ churches }: { churches: { id: string; name: string }[] }) {
  const { toast } = useToast();
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [giftDays, setGiftDays] = useState(30);
  const [giftFor, setGiftFor] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("*")
      .order("updated_at", { ascending: false });

    const { data: payData } = await supabase
      .from("asaas_payments")
      .select("church_id, value, status, paid_at, created_at")
      .order("created_at", { ascending: false });

    const churchMap = new Map(churches.map((c) => [c.id, c.name]));
    const lastPay = new Map<string, string>();
    (payData || []).forEach((p: any) => {
      if (p.status === "paid" && !lastPay.has(p.church_id)) {
        lastPay.set(p.church_id, p.paid_at || p.created_at);
      }
    });

    const enriched: SubRow[] = (subData || []).map((s: any) => ({
      ...s,
      church_name: churchMap.get(s.church_id) || "—",
      last_payment: lastPay.get(s.church_id) || null,
    }));
    setSubs(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churches.length]);

  const stats = useMemo(() => {
    const total = churches.length;
    const ativas = subs.filter((s) => s.status === "ativo" || s.status === "active" || s.is_gift).length;
    const pendentes = subs.filter((s) => s.status === "pending").length;
    const trial = subs.filter((s) => s.trial && s.status === "trial").length;
    const expiradas = subs.filter((s) => s.status === "expired").length;
    const monthlyRevenue = subs
      .filter((s) => (s.status === "ativo" || s.status === "active") && !s.is_gift)
      .reduce((sum, s) => {
        const v = PLAN_VALUES[(s.plan || "mensal") as string] ?? 0;
        return sum + (s.plan === "anual" ? v / 12 : v);
      }, 0);
    return { total, ativas, pendentes, trial, expiradas, monthlyRevenue };
  }, [subs, churches]);

  const grantGift = async (churchId: string, days: number) => {
    setBusy(churchId);
    try {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + days);
      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            church_id: churchId,
            status: "ativo",
            is_gift: true,
            provider: "gift",
            plan: "gift",
            trial: false,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            due_date: periodEnd.toISOString().slice(0, 10),
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "church_id" },
        );
      if (error) throw error;
      toast({ title: "Premium liberado!", description: `Acesso liberado por ${days} dias.` });
      setGiftFor(null);
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const revokeGift = async (churchId: string) => {
    setBusy(churchId);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          is_gift: false,
          status: "expired",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("church_id", churchId);
      if (error) throw error;
      toast({ title: "Acesso revogado" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const runRenew = async () => {
    setBusy("__renew__");
    try {
      const { data, error } = await supabase.functions.invoke("renew-subscriptions", { body: {} });
      if (error) throw error;
      toast({ title: "Renovação executada", description: `Processadas: ${(data as any)?.processed ?? 0}` });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const statusBadge = (s: SubRow) => {
    if (s.is_gift) return <Badge className="bg-purple-500 hover:bg-purple-600">🎁 Gift</Badge>;
    if (s.status === "ativo" || s.status === "active") return <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativa</Badge>;
    if (s.trial && s.status === "trial") return <Badge className="bg-blue-500 hover:bg-blue-600">Trial</Badge>;
    if (s.status === "pending") return <Badge variant="secondary">Pendente</Badge>;
    if (s.status === "expired") return <Badge variant="destructive">Expirada</Badge>;
    return <Badge variant="outline">{s.status || "—"}</Badge>;
  };

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  // Lista igrejas que ainda não têm subscription para liberar gift
  const churchesWithoutSub = churches.filter((c) => !subs.find((s) => s.church_id === c.id));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Building2, label: "Total", value: stats.total, color: "text-primary" },
          { icon: DollarSign, label: "Ativas", value: stats.ativas, color: "text-emerald-500" },
          { icon: Clock, label: "Trial", value: stats.trial, color: "text-blue-500" },
          { icon: AlertTriangle, label: "Pendentes", value: stats.pendentes, color: "text-amber-500" },
          {
            icon: DollarSign,
            label: "MRR estimado",
            value: `R$ ${stats.monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            color: "text-secondary",
          },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <s.icon className={`w-6 h-6 ${s.color}`} />
                <div>
                  <p className="text-lg font-bold leading-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Assinaturas</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={runRenew} disabled={busy === "__renew__"}>
            {busy === "__renew__" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Rodar renovação agora
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <>
              {churchesWithoutSub.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-muted/40 border border-dashed">
                  <p className="text-xs font-medium mb-2">Igrejas sem assinatura ({churchesWithoutSub.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {churchesWithoutSub.map((c) => (
                      <Button
                        key={c.id}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setGiftFor(c.id)}
                      >
                        <Gift className="w-3 h-3 mr-1" /> {c.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Igreja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Último pgto</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.church_name}</TableCell>
                        <TableCell>{statusBadge(s)}</TableCell>
                        <TableCell><Badge variant="outline">{s.plan || "—"}</Badge></TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(s.due_date || s.current_period_end)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{fmtDate(s.last_payment)}</TableCell>
                        <TableCell>
                          {s.is_gift ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => revokeGift(s.church_id)}
                              disabled={busy === s.church_id}
                            >
                              {busy === s.church_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revogar gift"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => setGiftFor(s.church_id)}
                              disabled={busy === s.church_id}
                            >
                              <Gift className="w-3 h-3 mr-1" /> Liberar Premium
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gift modal inline */}
      {giftFor && (
        <Card className="border-purple-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" /> Liberar Premium (Doação)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Igreja: <strong>{churches.find((c) => c.id === giftFor)?.name}</strong>
            </p>
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label>Dias de acesso</Label>
                <Input
                  type="number"
                  className="w-32"
                  min={1}
                  max={3650}
                  value={giftDays}
                  onChange={(e) => setGiftDays(Math.max(1, Number(e.target.value) || 30))}
                />
              </div>
              <Button onClick={() => grantGift(giftFor, giftDays)} disabled={busy === giftFor}>
                {busy === giftFor && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Liberar
              </Button>
              <Button variant="outline" onClick={() => setGiftFor(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
