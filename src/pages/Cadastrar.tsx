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
    const { data: authData, error: authError } = await supabase.auth.signUp({
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

    // ⚠️ IMPORTANTE: não confiar no authData.user ainda
    // vamos forçar login

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

    // ✅ 3. ESPERA REAL (ESSENCIAL)
    await new Promise((r) => setTimeout(r, 800));

    // ✅ 4. PEGA USUÁRIO REAL DA SESSÃO
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuário não autenticado após login.");

    // ✅ 5. GARANTE PROFILE (ANTI BUG MASTER)
    await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: data.fullName,
      email: data.email,
    });

    // ✅ 6. APLICA CONVITE (PONTO MAIS IMPORTANTE)
    const pendingToken = sessionStorage.getItem("pending_invite_token");
    let roles: string[] = [];

    if (pendingToken) {
      try {
        const result = await applyInvitationForUser(pendingToken, user);

        roles = result?.roles || [];

        sessionStorage.removeItem("pending_invite_token");

        toast({
          title: "Bem-vindo!",
          description: "Convite aplicado com sucesso",
        });
      } catch (err: any) {
        console.error("Erro ao aplicar convite:", err);

        toast({
          title: "Erro ao aplicar convite",
          description: err.message,
          variant: "destructive",
        });
      }
    }

    // ✅ 7. ATUALIZA SESSÃO (CRÍTICO)
    await supabase.auth.refreshSession();

    await new Promise((r) => setTimeout(r, 500));

    // ✅ 8. REDIRECIONA
    const redirectTo = getRoleBasedRedirect(roles);

    window.location.href = redirectTo;
  } catch (error: any) {
    console.error(error);

    setErrorMsg(
      error.message === "User already registered"
        ? "Este email já está cadastrado."
        : error.message || "Erro ao cadastrar."
    );
  } finally {
    setIsLoading(false);
  }
};
