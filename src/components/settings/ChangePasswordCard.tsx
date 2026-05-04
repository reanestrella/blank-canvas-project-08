import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function ChangePasswordCard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!profile?.email) {
      toast({ title: "Erro", description: "E-mail não encontrado.", variant: "destructive" });
      return;
    }
    if (next.length < 6) {
      toast({ title: "Senha curta", description: "A nova senha precisa ter ao menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Confirmação não confere", description: "A nova senha e a confirmação devem ser iguais.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Validate current password by re-authenticating
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: current,
      });
      if (signErr) {
        toast({ title: "Senha atual incorreta", description: "Verifique e tente novamente.", variant: "destructive" });
        return;
      }

      const { error: updErr } = await supabase.auth.updateUser({ password: next });
      if (updErr) throw updErr;

      toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e: any) {
      toast({ title: "Erro ao alterar senha", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> Alterar senha
        </CardTitle>
        <CardDescription>Use ao menos 6 caracteres.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Senha atual</Label>
          <div className="relative">
            <Input type={showC ? "text" : "password"} value={current}
              onChange={(e) => setCurrent(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowC(!showC)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <div className="relative">
            <Input type={showN ? "text" : "password"} value={next}
              onChange={(e) => setNext(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowN(!showN)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Confirmar nova senha</Label>
          <Input type={showN ? "text" : "password"} value={confirm}
            onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} disabled={loading || !current || !next || !confirm}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Atualizar senha
        </Button>
      </CardContent>
    </Card>
  );
}
