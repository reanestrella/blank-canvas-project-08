/**
 * Given an array of user role strings, returns the best dashboard route.
 */
export function getRoleBasedRedirect(roles: string[]): string {
  if (roles.includes("admin") || roles.includes("pastor")) return "/app";
  if (roles.includes("tesoureiro")) return "/financeiro";
  if (roles.includes("secretario")) return "/secretaria";
  if (roles.includes("consolidacao")) return "/consolidacao";
  if (roles.includes("lider_celula")) return "/celulas";
  if (roles.includes("lider_ministerio")) return "/ministerios";
  return "/meu-app";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}
