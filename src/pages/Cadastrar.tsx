import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ensureUserProfile } from "@/lib/authProfile";
import { isValidUUID } from "@/lib/getRoleBasedRedirect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Church } from "lucide-react";

interface CadastroFormData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  birthDate?: string;
  tipo?: string;
}

export default function Cadastrar() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || null;
  const validToken = !!token && isValidUUID(token);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<CadastroFormData>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    birthDate: "",
    tipo: "membro",
  });

  const update = (key: keyof CadastroFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validToken || !token) {
      setErrorMsg("Convite inválido.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      sessionStorage.setItem("pending_invite_token", token);

      // 1. SIGN UP
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone || null,
            birth_date: form.birthDate || null,
            tipo: form.tipo,
          },
        },
      });

      if (authError) throw authError;

      // 2. SIGN IN
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        toast({
          title: "Conta criada!",
          description: "Faça login para continuar.",
        });
        navigate("/login");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      let user = null;

      for (let i = 0; i < 5; i++) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          user = currentUser;
          break;
        }

        await new Promise((r) => setTimeout(r, 300));
      }

      if (!user) throw new Error("Usuário não autenticado.");

      await ensureUserProfile(user);

      console.log("TOKEN:", sessionStorage.getItem("pending_invite_token"));
      toast({ title: "Bem-vindo!", description: "Conta criada com sucesso." });
      window.location.href = "/app";
    } catch (error: any) {
      console.error("ERRO:", error);

      setErrorMsg(
        error.message === "User already registered"
          ? "Este email já está cadastrado."
          : error.message || "Erro ao cadastrar."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>Solicite um novo link.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Church className="mx-auto mb-2" />
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Preencha para entrar na igreja</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nome" value={form.fullName} onChange={update("fullName")} required />
            <Input type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
            <Input type="password" placeholder="Senha" value={form.password} onChange={update("password")} required />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Criar conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
