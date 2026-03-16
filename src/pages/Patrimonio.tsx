import { AppLayout } from "@/components/layout/AppLayout";
import { PatrimonioTab } from "@/components/patrimonio/PatrimonioTab";
import { useAuth } from "@/contexts/AuthContext";
import { Package } from "lucide-react";

export default function Patrimonio() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;

  if (!churchId) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Patrimônio
          </h1>
          <p className="text-muted-foreground">Gerencie os bens e equipamentos da igreja</p>
        </div>
        <PatrimonioTab churchId={churchId} />
      </div>
    </AppLayout>
  );
}
