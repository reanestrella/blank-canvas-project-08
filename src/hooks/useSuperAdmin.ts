import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsSuperAdmin(false);
      setIsChecking(false);
      return;
    }
    const check = async () => {
      const { data } = await supabase
        .from("system_admins")
        .select("id")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();
      setIsSuperAdmin(!!data);
      setIsChecking(false);
    };
    check();
  }, [user]);

  return { isSuperAdmin, isChecking };
}
