import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppUsersCount(churchId: string | null | undefined) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!churchId) { setCount(0); setIsLoading(false); return; }

    const fetch = async () => {
      setIsLoading(true);
      const { count: total } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("church_id", churchId);
      setCount(total || 0);
      setIsLoading(false);
    };
    fetch();
  }, [churchId]);

  return { count, isLoading };
}
