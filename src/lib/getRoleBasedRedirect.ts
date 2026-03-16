/**
 * Given an array of user role strings, returns the best dashboard route.
 */
export function getRoleBasedRedirect(roles: string[]): string {
  if (roles.includes("network_admin") || roles.includes("network_finance")) return "/rede";
  // All users go to Meu App on login
  return "/meu-app";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}
