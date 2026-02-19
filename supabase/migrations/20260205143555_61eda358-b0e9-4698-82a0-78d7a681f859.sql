-- Create function to get invitation with church name for public access
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role app_role,
  church_id uuid,
  token uuid,
  full_name text,
  congregation_id uuid,
  expires_at timestamptz,
  used_at timestamptz,
  church_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.email,
    i.role,
    i.church_id,
    i.token,
    i.full_name,
    i.congregation_id,
    i.expires_at,
    i.used_at,
    c.name as church_name
  FROM invitations i
  JOIN churches c ON c.id = i.church_id
  WHERE i.token = _token
    AND i.used_at IS NULL
    AND i.expires_at > now()
  LIMIT 1
$$;