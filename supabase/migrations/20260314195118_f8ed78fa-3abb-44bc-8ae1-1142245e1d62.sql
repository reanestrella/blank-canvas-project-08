
-- Fix setup_new_church: use 'pastor' instead of invalid 'admin' role
CREATE OR REPLACE FUNCTION public.setup_new_church(_church_name text, _email text, _full_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare
  v_user_id uuid;
  v_church_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(_email)
  limit 1;

  if v_user_id is null then
    return json_build_object('success', false, 'error', 'user not found');
  end if;

  insert into public.churches (name)
  values (_church_name)
  returning id into v_church_id;

  insert into public.profiles (user_id, church_id, full_name, email)
  values (v_user_id, v_church_id, _full_name, _email)
  on conflict (user_id)
  do update set church_id = excluded.church_id, full_name = excluded.full_name;

  -- Use 'pastor' which is the valid enum value for church admin
  insert into public.user_roles (user_id, church_id, role)
  values (v_user_id, v_church_id, 'pastor')
  on conflict (user_id, church_id, role) do nothing;

  return json_build_object('success', true, 'church_id', v_church_id);
end;
$$;

-- Create church_assets table for Patrimônio
CREATE TABLE IF NOT EXISTS public.church_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  quantity integer NOT NULL DEFAULT 1,
  condition text DEFAULT 'bom',
  location text,
  notes text,
  acquired_at date,
  estimated_value numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_church_assets_church ON public.church_assets(church_id);
