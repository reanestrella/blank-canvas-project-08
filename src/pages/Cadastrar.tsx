import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Church, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const signupSchema = z.object({
  fullName: z.string().min(2, "Nome completo deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Cadastrar() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const rawRedirect = searchParams.get("redirect");
  const redirectUrl = rawRedirect ? decodeURIComponent(rawRedirect) : null;

  // Extract token from redirect URL if present
  const pendingToken = (() => {
    if (redirectUrl && redirectUrl.includes("/accept-invite")) {
      try {
        const url = new URL(redirectUrl, window.location.origin);
        return url.searchParams.get("token") || null;
      } catch { return null; }
    }
    return sessionStorage.getItem("pending_invite_token") || null;
  })();

  // Persist redirect & token
  if (redirectUrl) {
    sessionStorage.setItem("post_login_redirect", redirectUrl);
  }
  if (pendingToken) {
    sessionStorage.setItem("pending_invite_token", pendingToken);
  }

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const handleSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setSignupError(null);
    try {
      const emailRedirectTo = pendingToken
        ? `${window.location.origin}/accept-invite?token=${encodeURIComponent(pendingToken)}`
        : window.location.origin;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo,
          data: { full_name: data.fullName },
        },
      });

      if (authError) {
        console.error("[Cadastrar] signUp error:", authError.message);
        setSignupError(authError.message);
        return;
      }

      if (!authData.user) {
        setSignupError("Não foi possível criar a conta.");
        return;
      }

      // If session came back immediately (no email confirmation required)
      if (authData.session) {
        // Update profile
        await supabase
          .from("profiles")
          .update({ full_name: data.fullName, email: data.email })
          .eq("user_id", authData.user.id);

        // If there's a pending invite token, go accept it
        if (pendingToken) {
          toast({ title: "Conta criada!", description: "Processando seu convite..." });
          navigate(`/accept-invite?token=${encodeURIComponent(pendingToken)}`, { replace: true });
          return;
        }

        const storedRedirect = sessionStorage.getItem("post_login_redirect");
        if (storedRedirect) {
          sessionStorage.removeItem("post_login_redirect");
          navigate(storedRedirect, { replace: true });
          return;
        }

        navigate("/app", { replace: true });
      } else {
        // Email confirmation required - show message
        setNeedsConfirmation(true);
      }
    } catch (error: any) {
      console.error("[Cadastrar] exception:", error?.message);
      setSignupError(error?.message || "Erro inesperado ao criar a conta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation screen
  if (needsConfirmation) {
    const loginUrl = pendingToken
      ? `/login?redirect=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(pendingToken)}`)}`
      : "/login";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <CardTitle>Conta criada com sucesso!</CardTitle>
            <CardDescription>
              Verifique seu email para confirmar a conta. Depois, faça login para concluir{pendingToken ? " o convite" : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Button className="w-full" onClick={() => navigate(loginUrl)}>
              Ir para Login
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Voltar ao site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <Church className="w-10 h-10 text-primary" />
          </Link>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            {pendingToken ? "Crie sua conta para aceitar o convite" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {signupError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Conta
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
                className="text-primary hover:underline font-medium"
              >
                Fazer login
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Voltar para o site
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
