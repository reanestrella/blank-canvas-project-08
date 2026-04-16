import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Users,
  Home,
  DollarSign,
  Calendar,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  Music,
  Package,
  Stethoscope,
  Baby,
  Mail,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResetDataSectionProps {
  churchId: string;
}

type ModuleKey =
  | "membros"
  | "celulas"
  | "financeiro"
  | "eventos"
  | "cursos"
  | "discipulado"
  | "consolidacao"
  | "ministerios"
  | "patrimonio"
  | "visitas"
  | "kids"
  | "convites";

const MODULES: Array<{
  key: ModuleKey;
  label: string;
  description: string;
  icon: typeof Users;
}> = [
  { key: "membros", label: "Membros", description: "Apaga todos os membros e dados vinculados (vínculos em células, escalas, etc).", icon: Users },
  { key: "celulas", label: "Células", description: "Apaga células, relatórios, presenças, visitantes e cuidados pastorais.", icon: Home },
  { key: "financeiro", label: "Financeiro", description: "Apaga lançamentos, contas, categorias e campanhas financeiras.", icon: DollarSign },
  { key: "eventos", label: "Eventos", description: "Apaga todos os eventos e inscrições.", icon: Calendar },
  { key: "cursos", label: "Ensino / Cursos", description: "Apaga cursos, aulas, quizzes, alunos e progresso.", icon: GraduationCap },
  { key: "discipulado", label: "Discipulado", description: "Apaga discipulados ativos e logs de acompanhamento.", icon: HeartHandshake },
  { key: "consolidacao", label: "Consolidação", description: "Apaga registros de consolidação de visitantes e novos convertidos.", icon: Sparkles },
  { key: "ministerios", label: "Ministérios", description: "Apaga ministérios, escalas, voluntários, funções e repertório.", icon: Music },
  { key: "patrimonio", label: "Patrimônio", description: "Apaga todos os bens patrimoniais cadastrados.", icon: Package },
  { key: "visitas", label: "Visitas Pastorais", description: "Apaga visitas pastorais e aconselhamentos.", icon: Stethoscope },
  { key: "kids", label: "Kids", description: "Apaga estudos da rede infantil.", icon: Baby },
  { key: "convites", label: "Convites", description: "Apaga todos os convites pendentes e expirados.", icon: Mail },
];

export function ResetDataSection({ churchId }: ResetDataSectionProps) {
  const [confirmModule, setConfirmModule] = useState<typeof MODULES[number] | null>(null);
  const [resetting, setResetting] = useState<ModuleKey | null>(null);

  const handleReset = async () => {
    if (!confirmModule) return;
    setResetting(confirmModule.key);
    try {
      const { data, error } = await supabase.rpc("reset_module_data", {
        p_church_id: churchId,
        p_module: confirmModule.key,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result?.success) {
        toast.error(result?.error || "Erro ao resetar módulo");
        return;
      }
      toast.success(`Módulo "${confirmModule.label}" foi resetado com sucesso.`);
      setConfirmModule(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao resetar módulo");
    } finally {
      setResetting(null);
    }
  };

  return (
    <>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Zona de Perigo — Resetar Dados por Módulo
          </CardTitle>
          <CardDescription>
            Apague permanentemente todos os dados de um módulo específico desta igreja. Esta ação é irreversível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.key}
                  className="flex items-start justify-between gap-3 p-4 rounded-lg border bg-card hover:border-destructive/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                      <Icon className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{mod.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmModule(mod)}
                    disabled={resetting === mod.key}
                    className="shrink-0"
                  >
                    {resetting === mod.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmModule} onOpenChange={(open) => !open && setConfirmModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Resetar módulo: {confirmModule?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <strong className="text-destructive">ATENÇÃO:</strong> Todos os dados deste módulo serão{" "}
                <strong>permanentemente apagados</strong> e não poderão ser recuperados.
              </span>
              <span className="block text-sm">{confirmModule?.description}</span>
              <span className="block text-sm font-medium pt-2">
                Esta ação é irreversível. Tem certeza que deseja continuar?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!resetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={!!resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sim, apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
