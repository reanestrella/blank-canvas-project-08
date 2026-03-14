
-- RPC to find user by email from auth.users (since profiles may have null email)
CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email text)
RETURNS TABLE(user_id uuid, email text, full_name text, church_id uuid, ministry_network_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::text as email,
    COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', '')::text as full_name,
    p.church_id,
    p.ministry_network_id
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE lower(au.email) = lower(p_email)
  LIMIT 1;
END;
$$;

-- Sermon outlines table for pastoral management
CREATE TABLE IF NOT EXISTS public.sermon_outlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  theme text,
  base_text text,
  content text,
  tags text[],
  sermon_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pastoral notes table
CREATE TABLE IF NOT EXISTS public.pastoral_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  note_type text NOT NULL DEFAULT 'geral',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
