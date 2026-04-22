const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return UUID_REGEX.test(value.trim());
}

export function getRoleBasedRedirect(roles: string[]) {
  // 🔒 proteção total contra undefined
  if (!roles || roles.length === 0) {
    return "/dashboard";
  }

  if (roles.includes("pastor")) {
    return "/admin";
  }

  if (roles.includes("tesoureiro")) {
    return "/financeiro";
  }

  if (roles.includes("secretario")) {
    return "/secretaria";
  }

  if (roles.includes("membro")) {
    return "/dashboard";
  }

  // 🔥 fallback final (NUNCA QUEBRA)
  return "/dashboard";
}
