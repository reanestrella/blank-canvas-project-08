import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Church, LogOut, LogIn, UserPlus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isValidUUID, getRoleBasedRedirect } from "@/lib/getRoleBasedRedirect";
import { applyInvitationForUser, fetchInvitationByToken } from "@/lib/authInvitation";
import { clearAuthBrowserCache } from "@/lib/authProfile";

const ROLE_LABELS: Record<string, string> = {
  pastor: "Pastor",
  secretario: "Secretário(a)",
  tesoureiro: "Tesoureiro(a)",
  lider_celula: "Líder de Célula",
  lider_ministerio: "Líder de Ministério",
  consolidacao: "Consolidação",
  membro: "Membro",
  admin: "Administrador",
};

type InviteInfo = {
  churchName: string;
  role: string;
  fullName: string | null;
  email: string | null;
};

export default function InviteGate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || null;
  const navigate = useNavigate();
  const { user, isLoading: authLoading, refreshUserData, signOut } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const autoAcceptRan = useRef(false);

  const validToken = !!token && isValidUUID(token);

  // Fetch invite details for display
  useEffect(() => {
    if (!validToken || !token) return;
    let cancelled = false;
    setInviteLoading(true);
    (async () => {
      try {
        const invite = await fetchInvitationByToken(token);
        if (cancelled) return;
        const { data: church } = await supabase
          .from("churches")
          .select("name")
          .eq("id", invite.church_id)
          .maybeSingle();
        if (cancelled) return;
        setInviteInfo({
          churchName: church?.name ?? "Igreja",
          role: invite.role,
          fullName: invite.full_name,
          email: invite.email,
        });
      } catch {
        // non-fatal: still show the page
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [validToken, token]);

  const handleAccept = useCallback(async () => {
    if (!token) return;
    setStatus("processing");
    setErrorMsg("");
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const currentUser = sessionData.user;
      if (!currentUser) {
        setErrorMsg("Usuário não autenticado.");
        setStatus("error");
        return;
      }

      const result = await applyInvitationForUser(token, currentUser);

      sessionStorage.removeItem("pending_invite_token");
      await refreshUserData();
      await clearAuthBrowserCache();

      toast({ title: "Convite aceito!", description: "Você foi vinculado à igreja com sucesso." });

      const roles: string[] = result.roles || [];
      const redirectTo = getRoleBasedRedirect(roles);
      window.location.href = redirectTo;
    } catch (err: any) {
      console.error("[InviteGate] exception:", err);
      setErrorMsg(err.message || "Erro inesperado ao aceitar convite.");
      setStatus("error");
    }
  }, [token, refreshUserData, toast]);

  const handleSwitchAccount = useCallback(async () => {
    if (!token) return;
    sessionStorage.setItem("pending_invite_token", token);
    await signOut();
    navigate(`/login?redirect=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token)}`)}`, { replace: true });
  }, [token, signOut, navigate]);

  // Auto-accept when user is authenticated and token is valid
  useEffect(() => {
    if (!user || !validToken || authLoading || autoAcceptRan.current) return;
    autoAcceptRan.current = true;
    handleAccept();
  }, [user, validToken, authLoading, handleAccept]);

  // Invalid or missing token
  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pt-8 pb-6">
            <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Convite inválido</h2>
            <p className="text-sm text-muted-foreground mt-1">
              O link do convite está incompleto ou inválido.
            </p>
          </CardHeader>
          <CardContent className="pb-8 flex justify-center">
            <Button onClick={() => navigate("/")}>Ir para página inicial</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Aceitando convite...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Erro ao aceitar convite</h2>
            <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
          </CardHeader>
          <CardContent className="pb-8 flex flex-col gap-2">
            <Button onClick={() => { autoAcceptRan.current = false; handleAccept(); }}>Tentar novamente</Button>
            <Button variant="outline" onClick={handleSwitchAccount}>
              <LogOut className="w-4 h-4 mr-2" />
              Entrar com outra conta
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>Ir para página inicial</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated — show welcome + login/signup options
  if (!user) {
    const returnUrl = `/accept-invite?token=${encodeURIComponent(token)}`;
    const redirectParam = encodeURIComponent(returnUrl);
    sessionStorage.setItem("pending_invite_token", token);

    const roleLabel = inviteInfo ? (ROLE_LABELS[inviteInfo.role] ?? inviteInfo.role) : null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          {/* Header card */}
          <Card className="shadow-lg overflow-hidden">
            {/* Colored banner */}
            <div className="gradient-primary h-2 w-full" />

            <CardHeader className="text-center pt-8 pb-4 px-8">
              {/* Church icon */}
              <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-5 shadow-md">
                <Church className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Welcome message */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Você recebeu um convite
                </p>
                {inviteInfo ? (
                  <>
                    <h1 className="text-2xl font-bold text-foreground">
                      {inviteInfo.churchName}
                    </h1>
                    {inviteInfo.fullName && (
                      <p className="text-base text-muted-foreground">
                        Olá, <span className="font-medium text-foreground">{inviteInfo.fullName}</span>!
                      </p>
                    )}
                    {roleLabel && (
                      <div className="pt-1">
                        <Badge variant="secondary" className="text-sm px-3 py-0.5">
                          {roleLabel}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <h1 className="text-2xl font-bold text-foreground">
                    Bem-vindo(a)!
                  </h1>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <p className="text-sm text-muted-foreground text-center mb-6">
                {inviteInfo
                  ? `Para aceitar o convite e acessar o app da ${inviteInfo.churchName}, escolha uma opção abaixo.`
                  : "Para aceitar o convite, faça login ou crie uma conta."}
              </p>

              <div className="space-y-3">
                <Button
                  className="w-full h-11 text-base"
                  onClick={() => navigate(`/login?redirect=${redirectParam}`)}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Já tenho conta — Entrar
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => navigate(`/cadastrar?token=${encodeURIComponent(token)}`)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar minha conta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer note */}
          {inviteInfo?.email && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Este convite foi enviado para <span className="font-medium">{inviteInfo.email}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Authenticated — manual accept confirmation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg overflow-hidden">
        <div className="gradient-primary h-2 w-full" />
        <CardHeader className="text-center pt-8 pb-4 px-8">
          <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-5 shadow-md">
            <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold">
            {inviteInfo ? inviteInfo.churchName : "Aceitar convite"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Você está logado como <strong>{user.email}</strong>.
            <br />
            Deseja aceitar o convite com esta conta?
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex flex-col gap-2">
          <Button className="w-full h-11" onClick={handleAccept}>
            Aceitar convite
          </Button>
          <Button variant="outline" className="w-full" onClick={handleSwitchAccount}>
            <LogOut className="w-4 h-4 mr-2" />
            Entrar com outra conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
