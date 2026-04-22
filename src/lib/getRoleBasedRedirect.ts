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
