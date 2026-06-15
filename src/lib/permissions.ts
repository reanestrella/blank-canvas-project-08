// Catálogo central de módulos do sistema e defaults por função.
// Usado por: convite, criação manual, sidebar, RoleGuard.

export type ModuleKey =
  | "dashboard"
  | "secretaria"
  | "ministerios"
  | "celulas"
  | "consolidacao"
  | "ensino"
  | "financeiro"
  | "patrimonio"
  | "eventos"
  | "gestao_pastoral"
  | "lembretes"
  | "assistente"
  | "gestao_app"
  | "tesouraria";

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  secretaria: "Secretaria / Membros",
  ministerios: "Ministérios",
  celulas: "Células",
  consolidacao: "Consolidação",
  ensino: "Ensino / Cursos",
  financeiro: "Financeiro",
  patrimonio: "Patrimônio",
  eventos: "Eventos",
  gestao_pastoral: "Gestão Pastoral",
  lembretes: "Lembretes",
  assistente: "Assistente IA",
  gestao_app: "Gestão do App",
  tesouraria: "Tesouraria",
};

// Mapeia módulo -> caminho da rota principal
export const MODULE_PATH: Record<ModuleKey, string> = {
  dashboard: "/app",
  secretaria: "/secretaria",
  ministerios: "/ministerios",
  celulas: "/celulas",
  consolidacao: "/consolidacao",
  ensino: "/ensino",
  financeiro: "/financeiro",
  patrimonio: "/patrimonio",
  eventos: "/eventos",
  gestao_pastoral: "/gestao-pastoral",
  lembretes: "/lembretes",
  assistente: "/assistente",
  gestao_app: "/gestao-app",
  tesouraria: "/app/tesouraria",
};

// Defaults pré-selecionados por função (admin pode editar antes de gerar convite)
export const DEFAULT_PERMISSIONS: Record<string, ModuleKey[]> = {
  pastor: Object.keys(MODULE_LABELS) as ModuleKey[], // tudo
  tesoureiro: ["financeiro", "patrimonio", "tesouraria"],
  secretario: ["secretaria", "ministerios", "consolidacao", "eventos", "lembretes", "ensino"],
  lider_celula: ["celulas"],
  vice_lider_celula: ["celulas"],
  lider_ministerio: ["ministerios"],
  consolidacao: ["consolidacao", "secretaria"],
  membro: [],
};

export function defaultPermissionsFor(role: string): ModuleKey[] {
  return DEFAULT_PERMISSIONS[role] ?? [];
}

// Verifica se uma rota está liberada por um conjunto de permissões.
// `permissions = null/undefined` significa LEGADO (sem filtro granular) — libera por role no nível do componente que chama.
export function pathAllowedByPermissions(path: string, permissions: string[] | null | undefined): boolean {
  if (!permissions) return true; // legado
  // qualquer módulo cujo caminho seja prefixo do path
  return (Object.keys(MODULE_PATH) as ModuleKey[]).some((mod) => {
    if (!permissions.includes(mod)) return false;
    const base = MODULE_PATH[mod];
    return path === base || path.startsWith(base + "/");
  });
}
