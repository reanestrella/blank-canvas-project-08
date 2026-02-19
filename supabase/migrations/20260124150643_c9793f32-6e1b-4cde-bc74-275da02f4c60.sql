-- Add congregation_id column to profiles table (was missing)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS congregation_id uuid REFERENCES public.congregations(id);

-- Recreate the RPC function with proper column handling
CREATE OR REPLACE FUNCTION public.register_invited_user(
  _invitation_token uuid,
  _user_id uuid,
  _full_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
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

  -- Create profile (congregation_id is now optional)
  INSERT INTO profiles (user_id, church_id, full_name, email, congregation_id)
  VALUES (
    _user_id, 
    _invitation.church_id, 
    _full_name, 
    _invitation.email,
    _invitation.congregation_id
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.register_invited_user(uuid, uuid, text) TO authenticated;