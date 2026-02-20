import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Church, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isValidUUID, getRoleBasedRedirect } from "@/lib/getRoleBasedRedirect";

export default function InviteGate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, isLoading: authLoading, refreshUserData, signOut } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "processing" | "error" | "invalid-token">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  console.log("[InviteGate] token", token);
  console.log("[InviteGate] session", user?.id);

  // Invalid or missing token
  if (!token || !isValidUUID(token)) {
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

  // Still loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Church className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in — save token and redirect to login
  if (!user) {
    sessionStorage.setItem("pending_invite_token", token);
    const returnUrl = `/accept-invite?token=${encodeURIComponent(token)}`;
    navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Faça login para aceitar o convite</CardTitle>
            <CardDescription>Redirecionando para a página de login...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in — show accept screen
  const handleAccept = async () => {
    setStatus("processing");
    try {
      console.log("[InviteGate] calling accept_invitation with p_token:", token);
      const { data, error } = await supabase.rpc("accept_invitation" as any, {
        p_token: token,
      } as any);

      console.log("[InviteGate] rpc result", data, error);

      if (error) {
        console.error("accept_invitation RPC error:", error?.message, (error as any)?.details, (error as any)?.hint, error);
        setErrorMsg(error.message || "Erro ao aceitar convite.");
        setStatus("error");
        return;
      }

      const result = data as any;
      if (result && result.success === false) {
        setErrorMsg(result.error || "Erro ao aceitar convite.");
        setStatus("error");
        return;
      }

      // Clear pending token
      sessionStorage.removeItem("pending_invite_token");

      // Reload profile + roles
      await refreshUserData();

      toast({ title: "Convite aceito!", description: "Você foi vinculado à igreja com sucesso." });

      // Redirect based on roles
      const roles: string[] = result?.roles || [];
      const redirectTo = getRoleBasedRedirect(roles);
      console.log("[InviteGate] redirecting to:", redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error("[InviteGate] exception:", err);
      setErrorMsg(err.message || "Erro inesperado ao aceitar convite.");
      setStatus("error");
    }
  };

  const handleSwitchAccount = async () => {
    sessionStorage.setItem("pending_invite_token", token);
    await signOut();
    navigate(`/login?redirect=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token)}`)}`, { replace: true });
  };

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
            <Button onClick={handleAccept}>Tentar novamente</Button>
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
          <CardTitle>Aceitar convite</CardTitle>
          <CardDescription>
            Você está logado como <strong>{user.email}</strong>.
            <br />
            Deseja aceitar o convite com esta conta?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={status === "processing"}
          >
            {status === "processing" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Aceitar convite
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSwitchAccount}
            disabled={status === "processing"}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair e entrar com outra conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
