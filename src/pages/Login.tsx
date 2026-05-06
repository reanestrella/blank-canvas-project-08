import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { APP_BRAND_LOGO, APP_BRAND_NAME } from "@/lib/brand";
import { applyInvitationForUser } from "@/lib/authInvitation";
import { clearAuthBrowserCache, ensureUserProfile } from "@/lib/authProfile";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // 🔥 CAPTURA TOKEN DIRETO DA URL
  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      console.log("TOKEN DIRETO DA URL:", token);

      sessionStorage.setItem("pending_invite_token", token);
      localStorage.setItem("pending_invite_token", token);
    }
  }, [searchParams]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // 🔥 GARANTE USER APÓS LOGIN
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
const getInviteToken = () => {
  const token =
    sessionStorage.getItem("pending_invite_token") ||
    localStorage.getItem("pending_invite_token");

  console.log("🔎 TOKEN LIDO:", token);

  return token;
};
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
          description: "Email ou senha incorretos.",
          variant: "destructive",
        });
        return;
      }

      const user = await getUserWithRetry();

      await ensureUserProfile(user);

      // 🔥 APLICA CONVITE
      const inviteToken =
        const inviteToken = getInviteToken();||
        localStorage.getItem("pending_invite_token");

      console.log("TOKEN NO LOGIN:", inviteToken);

      if (inviteToken) {
        console.log("APLICANDO CONVITE:", inviteToken);
        await new Promise((r) => setTimeout(r, 300));
        await applyInvitationForUser(inviteToken, user);

        sessionStorage.removeItem("pending_invite_token");
        localStorage.removeItem("pending_invite_token");
      }

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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={APP_BRAND_LOGO} className="h-14 mx-auto mb-2" />
          <CardTitle>Bem-vindo de volta</CardTitle>
          <CardDescription>
            Entre com seu email e senha
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
                      <Input type="email" {...field} />
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
