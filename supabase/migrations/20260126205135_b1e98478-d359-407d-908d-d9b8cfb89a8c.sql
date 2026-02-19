-- Adicionar member_id na tabela de convites para pré-vincular ao membro
ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.members(id) ON DELETE SET NULL;

-- Atualizar a função de registro para usar member_id do convite se disponível
CREATE OR REPLACE FUNCTION public.register_invited_user(_invitation_token uuid, _user_id uuid, _full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invitation RECORD;
  _member_id uuid;
BEGIN
  -- Validate invitation
  SELECT * INTO _invitation
  FROM invitations
  WHERE token = _invitation_token
    AND used_at IS NULL
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  -- Use member_id from invitation if set, otherwise try to find by email
  _member_id := _invitation.member_id;
  
  IF _member_id IS NULL THEN
    SELECT id INTO _member_id
    FROM members
    WHERE church_id = _invitation.church_id
      AND email = _invitation.email
    LIMIT 1;
  END IF;

  -- Create profile with member_id if found
  INSERT INTO profiles (user_id, church_id, full_name, email, congregation_id, member_id)
  VALUES (
    _user_id, 
    _invitation.church_id, 
    _full_name, 
    _invitation.email,
    _invitation.congregation_id,
    _member_id
  );

  -- Assign role
  INSERT INTO user_roles (user_id, church_id, role)
  VALUES (_user_id, _invitation.church_id, _invitation.role);

  -- Mark invitation as used
  UPDATE invitations 
  SET used_at = now() 
  WHERE id = _invitation.id;
END;
$$;