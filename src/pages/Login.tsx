// 🔥 ALTERAÇÃO PRINCIPAL: salvar igreja_id + FORÇAR RELOAD

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
import { Church, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getRoleBasedRedirect } from "@/lib/getRoleBasedRedirect";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const inviteToken = searchParams.get("invite_token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectUrl = rawRedirect ? decodeURIComponent(rawRedirect) : null;
  if (redirectUrl) {
    sessionStorage.setItem("post_login_redirect", redirectUrl);
  }

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
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

      const userId = authData.user?.id;

      // 🔥 SUPER ADMIN
      const { data: superAdminData } = await supabase
        .from("system_admins")
        .select("id")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();

      if (superAdminData) {
        navigate("/master");
        return;
      }

      // 🔥 BUSCAR PERFIL
      let profile: { church_id: string | null } | null = null;
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("user_id", userId)
        .maybeSingle();

      profile = existingProfile;

      if (!profile) {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ user_id: userId })
          .select("church_id")
          .single();
        profile = newProfile;
      }

      // 🚀 SALVAR IGREJA + RELOAD (AQUI ESTÁ A MÁGICA)
      if (profile?.church_id) {
        localStorage.setItem("igreja_id", profile.church_id);
        console.log("✅ igreja_id salvo:", profile.church_id);

        // 🔥 FORÇA RECARREGAR PARA ATIVAR O MANIFEST
        window.location.reload();
        return;
      }

      // 🚨 SEM IGREJA
      if (!profile?.church_id) {
        toast({
          title: "Bem-vindo!",
          description: "Você ainda não tem uma igreja vinculada.",
        });
        navigate("/app");
        return;
      }

      // 🔥 ROLES
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("church_id", profile.church_id);

      const roles = rolesData?.map((r: any) => r.role) || [];

      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });

     const redirectTo = getRoleBasedRedirect(roles);

// 🔥 FORÇA REDIRECIONAMENTO REAL
window.location.href = redirectTo;

    } catch (error) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <Church className="w-10 h-10 text-primary" />
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
