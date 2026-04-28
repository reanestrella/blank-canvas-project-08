import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ensureUserProfile } from "@/lib/authProfile";
import { syncSelfRegistrationProfile } from "@/lib/selfRegistration";
import { isValidUUID } from "@/lib/getRoleBasedRedirect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Church, User, Mail, Lock, Phone, Calendar, CheckCircle2 } from "lucide-react";

const phoneMask = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const schema = z.object({
  fullName: z.string().trim().min(3, "Nome muito curto").max(120, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(72),
  phone: z.string().trim().min(14, "Telefone inválido").max(20),
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  tipo: z.enum(["visitante", "membro"]),
  isBaptized: z.enum(["sim", "nao"]),
});

type FormData = z.infer<typeof schema>;

export default function Cadastrar() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || null;
  const churchParam = searchParams.get("church")?.trim() || null;
  const validToken = !!token && isValidUUID(token);
  const validChurch = !!churchParam && isValidUUID(churchParam);
  const hasValidEntry = validToken || validChurch;

  const navigate = useNavigate();
  const { toast } = useToast();

  const [churchName, setChurchName] = useState<string | null>(null);
  const [churchCheckError, setChurchCheckError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "",
    tipo: "visitante",
    isBaptized: "nao",
  });

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((p) => ({ ...p, [k]: undefined }));
  };

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: any = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setFieldErrors(errs);
      return;
    }
    if (!hasValidEntry) {
      setErrorMsg("Link inválido. Solicite um novo link de cadastro.");
      return;
    }

    setIsLoading(true);
    console.log("[Autocadastro] iniciado", { tipo: form.tipo, validToken, validChurch });

    try {
      if (validToken && token) {
        sessionStorage.setItem("pending_invite_token", token);
      }

      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            birth_date: form.birthDate,
            tipo: form.tipo,
            is_baptized: form.isBaptized === "sim",
            church_id: validChurch ? churchParam : undefined,
          },
        },
      });
      if (authError) throw authError;
      console.log("[Autocadastro] usuário criado");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) {
        toast({ title: "Conta criada!", description: "Faça login para continuar." });
        navigate("/login");
        return;
      }

      // wait for session
      let user = null;
      for (let i = 0; i < 6; i++) {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) { user = u; break; }
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!user) throw new Error("Sessão não disponível.");

      await ensureUserProfile(user);
      console.log("[Autocadastro] profile criado/garantido");

      // Self-registration: bind church_id, role membro, create pending_users entry
      if (!validToken && validChurch && churchParam) {
        await syncSelfRegistrationProfile(user, {
          churchId: churchParam,
          fullName: form.fullName,
          phone: form.phone,
          birthDate: form.birthDate,
          tipo: form.tipo,
          registrationStatus: "pendente",
          ensurePendingUser: true,
        });
        console.log("[Autocadastro] church_id vinculado e role 'membro' atribuída");
      }

      toast({ title: "Bem-vindo!", description: "Conta criada. Aguarde aprovação da secretaria." });
      console.log("[Autocadastro] redirecionando para /meu-app");
      window.location.href = "/meu-app";
    } catch (error: any) {
      console.error("[Autocadastro] ERRO:", error);
      setErrorMsg(
        error.message === "User already registered"
          ? "Este email já está cadastrado. Faça login."
          : error.message || "Erro ao cadastrar."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Solicite um novo link de convite ou cadastro.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">Voltar para início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Church className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>
            {validToken ? "Preencha seus dados para entrar na igreja" : "Cadastre-se para acessar o app da igreja"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> Nome completo</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Seu nome completo" required />
              {fieldErrors.fullName && <p className="text-xs text-destructive">{fieldErrors.fullName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="voce@email.com" required />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Senha</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" required />
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Telefone</Label>
                <Input id="phone" inputMode="tel" value={form.phone} onChange={(e) => set("phone", phoneMask(e.target.value))} placeholder="(11) 99999-9999" required />
                {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Nascimento</Label>
                <Input id="birthDate" type="date" max={today} value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} required />
                {fieldErrors.birthDate && <p className="text-xs text-destructive">{fieldErrors.birthDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Você é</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as "visitante" | "membro")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitante">Visitante</SelectItem>
                  <SelectItem value="membro">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Já é batizado?</Label>
              <RadioGroup value={form.isBaptized} onValueChange={(v) => set("isBaptized", v as "sim" | "nao")} className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="sim" id="bap-sim" />
                  <span className="text-sm">Sim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="nao" id="bap-nao" />
                  <span className="text-sm">Não</span>
                </label>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</> : "Criar conta"}
            </Button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Já tem conta? <button type="button" onClick={() => navigate("/login")} className="text-primary hover:underline">Entrar</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
