-- Add columns to invitations table for pre-filled name and congregation
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS congregation_id uuid REFERENCES public.congregations(id);

-- Create RPC function to register invited users (bypasses RLS)
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

  -- Create profile (use congregation_id from invitation if provided)
  INSERT INTO profiles (user_id, church_id, congregation_id, full_name, email)
  VALUES (
    _user_id, 
    _invitation.church_id, 
    _invitation.congregation_id,
    _full_name, 
    _invitation.email
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_invited_user(uuid, uuid, text) TO authenticated;