// 🔥 PARTE PRINCIPAL (SUBMIT CORRIGIDO)

const handleSubmit = async (data: CadastroFormData) => {
  if (!validToken || !token) {
    setErrorMsg("Convite inválido.");
    return;
  }

  setIsLoading(true);
  setErrorMsg(null);

  try {
    // 1. Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error("Erro ao criar usuário");

    // 2. Login automático
    await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    // 3. Buscar convite direto da tabela correta
    const { data: convite, error: conviteError } = await supabase
      .from("invitations") // 🔥 NOME CORRETO DA SUA TABELA
      .select("*")
      .eq("token", token)
      .single();

    if (conviteError || !convite) {
      throw new Error("Convite não encontrado");
    }

    // 4. CRIAR PROFILE MANUALMENTE (ESSA É A CORREÇÃO PRINCIPAL)
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: data.fullName,
        email: data.email,
        church_id: convite.church_id,
        registration_status: "ativo",
      });

    if (profileError) {
      console.error(profileError);
      throw new Error("Erro ao criar perfil");
    }

    // 5. INSERIR ROLE (TESOUREIRO, MEMBRO, ETC)
    const roleToInsert = convite.role || "membro";

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        church_id: convite.church_id,
        role: roleToInsert,
      });

    if (roleError) {
      console.error(roleError);
    }

    // 6. Marcar convite como usado
    await supabase
      .from("invitations")
      .update({
        status: "accepted",
        used_at: new Date().toISOString(),
      })
      .eq("token", token);

    // 7. Limpar token
    sessionStorage.removeItem("pending_invite_token");

    toast({
      title: "Cadastro concluído!",
      description: "Bem-vindo à igreja!",
    });

    // 8. Redirecionar
    window.location.href = "/app";

  } catch (error: any) {
    console.error(error);
    setErrorMsg(error.message || "Erro ao cadastrar");
  } finally {
    setIsLoading(false);
  }
};
}
