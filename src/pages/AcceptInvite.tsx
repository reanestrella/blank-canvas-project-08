import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Church } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isValidUUID, getRoleBasedRedirect } from "@/lib/getRoleBasedRedirect";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, isLoading: authLoading, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "processing" | "error" | "invalid-token">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token || !isValidUUID(token)) {
      console.log("token:", token, "- inválido ou ausente");
      setStatus("invalid-token");
      return;
    }

    console.log("token:", token);

    if (authLoading) return;

    if (!user) {
      // Preserve full return path including token
      const returnUrl = `/accept-invite?token=${encodeURIComponent(token)}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
      return;
    }

    acceptInvitation(token);
  }, [token, user, authLoading]);

  const acceptInvitation = async (inviteToken: string) => {
    setStatus("processing");
    try {
      console.log("Calling accept_invitation RPC with p_token:", inviteToken);
      const { data, error } = await supabase.rpc("accept_invitation" as any, {
        p_token: inviteToken,
      } as any);

      console.log("rpc result data:", data);
      console.log("rpc result error:", error);

      if (error) {
        console.error("accept_invitation RPC error:", error?.message, (error as any)?.details, (error as any)?.hint, error);
        setErrorMsg(error.message || "Erro ao aceitar convite.");
        setStatus("error");
        return;
      }

      const result = data as any;
      console.log("accept_invite result", result);

      if (result && result.success === false) {
        console.error("accept_invitation returned failure:", result.error);
        setErrorMsg(result.error || "Erro ao aceitar convite.");
        setStatus("error");
        return;
      }

      // Reload profile (church_id) + roles
      await refreshUserData();

      toast({ title: "Convite aceito!", description: "Você foi vinculado à igreja com sucesso." });

      // Role-based redirect
      const roles: string[] = result?.roles || [];
      console.log("roles from RPC:", roles);
      const redirectTo = getRoleBasedRedirect(roles);
      console.log("redirecting to:", redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error("AcceptInvite exception:", err);
      setErrorMsg(err.message || "Erro inesperado ao aceitar convite.");
      setStatus("error");
    }
  };

  if (status === "invalid-token") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>O link do convite está incompleto ou inválido.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/")}>Ir para página inicial</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Erro ao aceitar convite</CardTitle>
            <CardDescription>{errorMsg}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Button onClick={() => token && acceptInvitation(token)}>Tentar novamente</Button>
            <Button variant="ghost" onClick={() => navigate("/")}>Ir para página inicial</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
            <Church className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle>Aceitando convite...</CardTitle>
          <CardDescription>Aguarde enquanto vinculamos sua conta à igreja.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}
