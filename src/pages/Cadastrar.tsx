const handleSubmit = async (data: CadastroFormData) => {
  if (!validToken || !token) {
    setErrorMsg("Convite inválido. Solicite um novo link de convite.");
    return;
  }

  setIsLoading(true);
  setErrorMsg(null);

  try {
    sessionStorage.setItem("pending_invite_token", token);

    // ✅ 1. CRIA USUÁRIO
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone || null,
          birth_date: data.birthDate || null,
          tipo: data.tipo,
        },
      },
    });

    if (authError) throw authError;

    // ✅ 2. LOGIN FORÇADO
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      toast({
        title: "Conta criada!",
        description: "Faça login para continuar.",
      });
      navigate("/login");
      return;
    }

    // ✅ 3. ESPERA (EVITA BUG DE SINCRONIZAÇÃO)
    await new Promise((r) => setTimeout(r, 1000));

    // ✅ 4. PEGA USUÁRIO REAL
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuário não autenticado após login.");

    console.log("USER OK:", user.id);

    // ✅ 5. GARANTE PROFILE (CRÍTICO)
    await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: data.fullName,
      email: data.email,
    });

    // ✅ 6. APLICA CONVITE
    const pendingToken = sessionStorage.getItem("pending_invite_token");
    let roles: string[] = [];

    if (pendingToken) {
      try {
        console.log("APLICANDO CONVITE:", pendingToken);

        const result = await applyInvitationForUser(pendingToken, user);

        console.log("RESULTADO CONVITE:", result);

        roles = result?.roles || [];

        sessionStorage.removeItem("pending_invite_token");

        toast({
          title: "Bem-vindo!",
          description: "Convite aplicado com sucesso",
        });
      } catch (err: any) {
        console.error("ERRO CONVITE:", err);

        toast({
          title: "Erro ao aplicar convite",
          description: err.message,
          variant: "destructive",
        });
      }
    }

    // ✅ 7. FALLBACK (ANTI BUG)
    if (!roles || roles.length === 0) {
      console.warn("⚠️ Usuário sem roles. Buscando no banco...");

      const { data: rolesFromDB } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesFromDB && rolesFromDB.length > 0) {
        roles = rolesFromDB.map((r: any) => r.role);
      } else {
        roles = ["membro"];
      }
    }

    console.log("ROLES FINAIS:", roles);

    // ✅ 8. ATUALIZA SESSÃO
    await supabase.auth.refreshSession();
    await new Promise((r) => setTimeout(r, 500));

    // ✅ 9. REDIRECT SEGURO
    let redirectTo = getRoleBasedRedirect(roles);

    if (!redirectTo || typeof redirectTo !== "string") {
      console.error("REDIRECT QUEBRADO:", redirectTo);
      redirectTo = "/dashboard";
    }

    console.log("REDIRECT:", redirectTo);

    window.location.href = redirectTo;

  } catch (error: any) {
    console.error("ERRO GERAL:", error);

    setErrorMsg(
      error.message === "User already registered"
        ? "Este email já está cadastrado."
        : error.message || "Erro ao cadastrar."
    );

  } finally {
    setIsLoading(false);
  }
};
