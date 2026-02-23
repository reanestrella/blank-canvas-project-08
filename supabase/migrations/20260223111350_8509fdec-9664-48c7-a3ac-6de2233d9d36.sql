
-- Create system_admins table for super admin / developer access
CREATE TABLE public.system_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'super_admin',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can read this table
CREATE POLICY "Super admins can read system_admins"
  ON public.system_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_admins
    WHERE user_id = auth.uid() AND active = true
  );
$$;
