import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const dateStr = format(currentDate, "yyyy-MM-dd");

  useEffect(() => {
    fetchDevotional();
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

  const goDay = (delta: number) => {
    setCurrentDate(prev => delta > 0 ? addDays(prev, 1) : subDays(prev, 1));
  };

  const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

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
          {isToday && <Badge variant="secondary" className="text-[10px] mt-1">Hoje</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => goDay(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
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
