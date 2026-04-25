// 🔥 LOGIN SIMPLIFICADO — redireciona sempre para /meu-app

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";
import { applyInvitationForUser } from "@/lib/authInvitation";
import { clearAuthBrowserCache, ensureUserProfile, getInviteTokenFromRedirect } from "@/lib/authProfile";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Store pending redirect (e.g. from invite link)
  useEffect(() => {
    if (!rawRedirect) return;
    const decoded = decodeURIComponent(rawRedirect);
    sessionStorage.setItem("post_login_redirect", decoded);
    const inviteToken = getInviteTokenFromRedirect(decoded);
    if (inviteToken) {
      sessionStorage.setItem("pending_invite_token", inviteToken);
    }
  }, [rawRedirect]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: "Erro de autenticação",
          description: error.message === "Invalid login credentials"
            ? "Email ou senha incorretos."
            : error.message,
          variant: "destructive",
        });
        return;
      }

      // Session persistence preference
      if (keepLoggedIn) {
        localStorage.setItem("keep_logged_in", "true");
      } else {
        localStorage.setItem("keep_logged_in", "false");
        sessionStorage.setItem("session_active", "1");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sessão não estabilizada após login.");
      }

      await ensureUserProfile(user);

      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });

      // Check for pending invite token from redirect/session storage
      const pendingRedirect = sessionStorage.getItem("post_login_redirect");
      const inviteToken = sessionStorage.getItem("pending_invite_token") || getInviteTokenFromRedirect(pendingRedirect);
      if (inviteToken) {
        console.log("TOKEN:", inviteToken);
        await applyInvitationForUser(inviteToken, user);
        sessionStorage.removeItem("pending_invite_token");
      }

      sessionStorage.removeItem("post_login_redirect");
      await clearAuthBrowserCache();
      window.location.href = "/app";
    } catch (error) {
      console.error("Erro login:", error);
      toast({ title: "Erro", description: "Erro ao fazer login.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md border-primary/15 shadow-[var(--shadow-lg)]">
        <CardHeader className="text-center">
          <Link to="/" className="mb-4 flex flex-col items-center justify-center gap-3">
            <div className="rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-lg)]">
              <img
                src={APP_BRAND_LOGO}
                alt={APP_BRAND_NAME}
                className="h-14 w-auto max-w-[220px] object-contain drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]"
              />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {APP_BRAND_NAME}
            </span>
          </Link>
          <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
          <CardDescription>
            Entre com seu email e senha para acessar o sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keep-logged-in"
                  checked={keepLoggedIn}
                  onCheckedChange={(checked) => setKeepLoggedIn(checked === true)}
                />
                <label
                  htmlFor="keep-logged-in"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Manter conectado
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Entrar
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Não tem uma conta?{" "}
              <Link to="/registro" className="text-primary hover:underline font-medium">
                Criar conta
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
