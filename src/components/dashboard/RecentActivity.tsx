import { Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      <div className="card-elevated p-6 animate-slide-up">
        <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="card-elevated p-6 animate-slide-up">
        <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
        <p className="text-sm text-muted-foreground text-center py-4">Sem atividade recente.</p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
      <div className="space-y-3">
        {members.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.description}</p>
              <p className="text-xs text-muted-foreground">
                {item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
