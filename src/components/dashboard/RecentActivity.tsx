import { Users, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  description: string;
  created_at: string;
}

export function RecentActivity() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;
  const [members, setMembers] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!churchId) { setIsLoading(false); return; }
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("members")
        .select("id, full_name, created_at")
        .eq("church_id", churchId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      setMembers((data || []).map(m => ({
        id: m.id,
        description: `${m.full_name} foi cadastrado(a)`,
        created_at: m.created_at || "",
      })));
      setIsLoading(false);
    };
    fetch();
  }, [churchId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Sem atividade recente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {members.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight truncate">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : ""}
                </p>
              </div>
              {i === 0 && (
                <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  Novo
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
