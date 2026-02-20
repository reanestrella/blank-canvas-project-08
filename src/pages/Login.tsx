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
  const inviteToken = searchParams.get("invite_token"); // legacy support
  const navigate = useNavigate();
  const { toast } = useToast();

  // Persist redirect on mount so it survives the login round-trip
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
        console.error("Login error:", error.message, (error as any).details, (error as any).hint);
        toast({
          title: "Erro de autenticação",
          description: error.message === "Invalid login credentials"
            ? "Email ou senha incorretos."
            : error.message,
          variant: "destructive",
        });
        return;
      }

      // 1) Check for pending invite token in sessionStorage
      const pendingToken = sessionStorage.getItem("pending_invite_token");
      console.log("[Login] pending_invite_token", pendingToken);

      if (pendingToken) {
        navigate(`/accept-invite?token=${encodeURIComponent(pendingToken)}`, { replace: true });
        return;
      }

      // 2) Check for persisted redirect (decoded) from sessionStorage
      const storedRedirect = sessionStorage.getItem("post_login_redirect");
      console.log("[Login] post_login_redirect", storedRedirect);

      if (storedRedirect) {
        sessionStorage.removeItem("post_login_redirect");
        navigate(storedRedirect, { replace: true });
        return;
      }

      // 3) Legacy: invite_token param
      if (inviteToken) {
        navigate(`/accept-invite?token=${encodeURIComponent(inviteToken)}`, { replace: true });
        return;
      }

      // Fetch profile to check church_id
      const userId = authData.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("user_id", userId)
          .maybeSingle();

        console.log("[Login] profile.church_id:", profile?.church_id);

        if (!profile?.church_id) {
          // No church — send to registration/onboarding
          toast({
            title: "Bem-vindo!",
            description: "Você ainda não tem uma igreja vinculada.",
          });
          navigate("/app"); // Will be caught by NoChurchScreen
          return;
        }

        // Fetch roles to determine correct dashboard
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("church_id", profile.church_id);

        const roles = rolesData?.map((r: any) => r.role) || [];
        console.log("[Login] roles:", roles);

        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso.",
        });

        const redirectTo = getRoleBasedRedirect(roles);
        console.log("[Login] redirecting to:", redirectTo);
        navigate(redirectTo);
      } else {
        navigate("/app");
      }
    } catch (error: any) {
      console.error("Login catch:", error?.message, error?.details, error?.hint);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login.",
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
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
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
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
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
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Voltar para o site
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
