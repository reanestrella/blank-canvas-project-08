const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return UUID_REGEX.test(value.trim());
}

/**
 * Returns a valid in-app route based on the user's roles.
 * Always returns a route that exists in the app router.
 */
export function getRoleBasedRedirect(roles: string[] | null | undefined): string {
  if (!roles || roles.length === 0) {
    return "/meu-app";
  }

  if (roles.includes("pastor")) {
    return "/app";
  }

  if (roles.includes("tesoureiro")) {
    return "/financeiro";
  }

  if (roles.includes("secretario")) {
    return "/secretaria";
  }

  if (roles.includes("lider_celula")) {
    return "/celulas";
  }

  if (roles.includes("consolidacao")) {
    return "/consolidacao";
  }

  if (roles.includes("lider_ministerio")) {
    return "/ministerios";
  }

  if (roles.includes("network_admin") || roles.includes("network_finance")) {
    return "/rede";
  }

  // Default: regular member goes to user app
  return "/meu-app";
}
