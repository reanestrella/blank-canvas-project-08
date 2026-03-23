import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, ChevronLeft, ChevronRight, Loader2, BookOpen, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Devotional {
  id: string;
  devotional_date: string;
  title: string;
  bible_reference: string | null;
  content: string;
  application: string | null;
  prayer: string | null;
}

export function DevotionalView({ churchId }: { churchId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const isFuture = dateStr > todayStr;
  const isToday = dateStr === todayStr;

  useEffect(() => {
    if (!isFuture) {
      fetchDevotional();
      fetchProgress();
    } else {
      setDevotional(null);
      setLoading(false);
    }
  }, [dateStr, churchId]);

  const fetchDevotional = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("devotionals" as any)
      .select("*")
      .eq("church_id", churchId)
      .eq("devotional_date", dateStr)
      .maybeSingle();
    setDevotional(data as Devotional | null);
    setLoading(false);
  };

  const fetchProgress = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("devotional_progress" as any)
      .select("completed")
      .eq("user_id", user.id)
      .eq("church_id", churchId)
      .eq("devotional_date", dateStr)
      .maybeSingle();
    setCompleted(!!(data as any)?.completed);
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    setSavingProgress(true);
    try {
      const { error } = await supabase
        .from("devotional_progress" as any)
        .upsert({
          user_id: user.id,
          church_id: churchId,
          devotional_date: dateStr,
          completed: true,
          completed_at: new Date().toISOString(),
        } as any, { onConflict: "user_id,church_id,devotional_date" });
      if (error) throw error;
      setCompleted(true);
      toast({ title: "Devocional concluído! ✅" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingProgress(false);
    }
  };

  const goDay = (delta: number) => {
    const next = delta > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1);
    const nextStr = format(next, "yyyy-MM-dd");
    // Block going to future
    if (nextStr > todayStr) return;
    setCurrentDate(next);
  };

  const canGoForward = format(addDays(currentDate, 1), "yyyy-MM-dd") <= todayStr;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Flame className="w-5 h-5 text-primary" /> Devocional Diário
      </h3>

      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => goDay(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium capitalize">
            {format(currentDate, "EEEE", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {isToday && <Badge variant="secondary" className="text-[10px]">Hoje</Badge>}
            {completed && <Badge className="text-[10px] bg-emerald-600"><Check className="w-3 h-3 mr-0.5" />Concluído</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => goDay(1)} disabled={!canGoForward}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {isFuture ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Devocional disponível apenas no dia.</p>
            <p className="text-xs text-muted-foreground mt-1">Volte amanhã para ler este devocional.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : devotional ? (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="text-center">
              <h4 className="text-xl font-bold">{devotional.title}</h4>
              {devotional.bible_reference && (
                <p className="text-sm text-primary mt-1 flex items-center justify-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {devotional.bible_reference}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm leading-relaxed whitespace-pre-line">{devotional.content}</p>
            </div>

            {devotional.application && (
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1">📌 Aplicação</p>
                <p className="text-sm whitespace-pre-line">{devotional.application}</p>
              </div>
            )}

            {devotional.prayer && (
              <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                <p className="text-xs font-semibold text-secondary mb-1">🙏 Oração</p>
                <p className="text-sm italic whitespace-pre-line">{devotional.prayer}</p>
              </div>
            )}

            {!completed && (
              <Button className="w-full" onClick={handleComplete} disabled={savingProgress}>
                {savingProgress ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Concluir Devocional
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum devocional para este dia.</p>
            <p className="text-xs text-muted-foreground mt-1">Navegue para outros dias usando as setas.</p>
          </CardContent>
        </Card>
      )}

      {!isToday && (
        <Button variant="outline" className="w-full" onClick={() => setCurrentDate(new Date())}>
          Ir para hoje
        </Button>
      )}
    </div>
  );
}
