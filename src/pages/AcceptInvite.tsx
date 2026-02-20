import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Church } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, isLoading: authLoading, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "processing" | "error" | "no-token">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    console.log("token:", token);

    if (authLoading) return;

    if (!user) {
      navigate(`/login?invite_token=${encodeURIComponent(token)}`, { replace: true });
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
        console.error("accept_invitation RPC error:", error?.message, error?.details, error?.hint, error);
        setErrorMsg(error.message || "Erro ao aceitar convite.");
        setStatus("error");
        return;
      }

      // Check RPC response for success flag
      const result = data as any;
      if (result && result.success === false) {
        console.error("accept_invitation returned failure:", result.error);
        setErrorMsg(result.error || "Erro ao aceitar convite.");
        setStatus("error");
        return;
      }

      // Reload profile + roles before navigating
      await refreshUserData();

      toast({ title: "Convite aceito!", description: "Você foi vinculado à igreja com sucesso." });
      navigate("/app", { replace: true });
    } catch (err: any) {
      console.error("AcceptInvite exception:", err);
      setErrorMsg(err.message || "Erro inesperado ao aceitar convite.");
      setStatus("error");
    }
  };

  if (status === "no-token") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Token não encontrado</CardTitle>
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
