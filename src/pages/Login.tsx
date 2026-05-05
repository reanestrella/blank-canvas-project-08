// 🔥 LOGIN SIMPLIFICADO — redireciona sempre para /app

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
 useEffect(() => {
  const tokenFromUrl = searchParams.get("token");

  if (tokenFromUrl) {
    console.log("TOKEN DIRETO DA URL (LOGIN):", tokenFromUrl);

    sessionStorage.setItem("pending_invite_token", tokenFromUrl);
    localStorage.setItem("pending_invite_token", tokenFromUrl);
  }
}, [searchParams]);
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

  useEffect(() => {
    const remembered = localStorage.getItem("remembered_email");
    if (remembered) {
      form.setValue("email", remembered);
      setKeepLoggedIn(true);
    }
  }, []);

  // 🔥 FUNÇÃO CORRETA PARA PEGAR USER
  const getUserWithRetry = async () => {
    let attempts = 0;

    while (attempts < 5) {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (user) return user;

      await new Promise((r) => setTimeout(r, 500));
      attempts++;
    }

    throw new Error("Usuário não disponível após login.");
  };

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // 🔐 LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: "Erro de autenticação",
          description:
            error.message === "Invalid login credentials"
              ? "Email ou senha incorretos."
              : error.message,
          variant: "destructive",
        });
        return;
      }

      // 🔥 GARANTE USER
      const user = await getUserWithRetry();

      await ensureUserProfile(user);

      // 🔥 APLICA CONVITE
      const inviteToken = sessionStorage.getItem("pending_invite_token");

      console.log("TOKEN NO LOGIN:", inviteToken);

      if (inviteToken) {
        console.log("APLICANDO CONVITE:", inviteToken);

        await applyInvitationForUser(inviteToken, user);

        sessionStorage.removeItem("pending_invite_token");
      }

      // 🔒 CONTROLE DE SESSÃO POR ROLE
      try {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const userRoles = (rolesData || []).map((r: any) => r.role);

        const isSensitiveRole = userRoles.some((r: string) =>
          ["pastor", "admin", "tesoureiro", "secretario"].includes(r)
        );

        if (isSensitiveRole) {
          localStorage.setItem("keep_logged_in", "false");
          localStorage.removeItem("remembered_email");
          sessionStorage.setItem("session_active", "1");
        }
      } catch (e) {
        console.warn("[Login] erro ao verificar roles:", e);
      }

      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });

      sessionStorage.removeItem("post_login_redirect");

      await clearAuthBrowserCache();

    window.location.href = "/app";

} catch (error) {
      console.error("Erro login:", error);

      toast({
        title: "Erro",
        description: "Erro ao fazer login.",
        variant: "destructive",
      });

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
              <img src={APP_BRAND_LOGO} alt={APP_BRAND_NAME} className="h-14 w-auto" />
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
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
