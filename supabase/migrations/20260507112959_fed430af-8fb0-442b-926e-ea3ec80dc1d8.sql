
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS cell_ids uuid[] DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_invite record;
  v_user_id uuid;
  v_cell uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'Usuário não autenticado');
  end if;

  select * into v_invite
  from public.invitations
  where token = p_token and status = 'pending';

  if not found then
    return json_build_object('success', false, 'error', 'Convite inválido ou já utilizado');
  end if;

  -- Vincular profile
  update public.profiles set church_id = v_invite.church_id where user_id = v_user_id;

  -- Inserir/atualizar role com permissions
  insert into public.user_roles (user_id, church_id, role, permissions)
  values (v_user_id, v_invite.church_id, v_invite.role, v_invite.permissions)
  on conflict (user_id, church_id, role) do update
    set permissions = excluded.permissions;

  -- Vincular células se houver
  if v_invite.cell_ids is not null then
    foreach v_cell in array v_invite.cell_ids loop
      insert into public.cell_leaders (user_id, cell_id, church_id)
      values (v_user_id, v_cell, v_invite.church_id)
      on conflict (user_id, cell_id) do nothing;
    end loop;
  end if;

  update public.invitations set status='accepted', used_at=now() where id=v_invite.id;

  return json_build_object('success', true, 'church_id', v_invite.church_id, 'roles', array[v_invite.role]);
end;
$$;
