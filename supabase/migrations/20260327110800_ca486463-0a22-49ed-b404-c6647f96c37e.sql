-- 1. Create pending_users table for public self-registration
CREATE TABLE IF NOT EXISTS public.pending_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'visitante',
  status text NOT NULL DEFAULT 'pendente',
  linked_member_id uuid REFERENCES public.members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert pending_users"
  ON public.pending_users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Church admins can read pending_users"
  ON public.pending_users FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.church_id = pending_users.church_id
  ));

CREATE POLICY "Church admins can update pending_users"
  ON public.pending_users FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.church_id = pending_users.church_id
    AND ur.role IN ('pastor', 'secretario')
  ));

CREATE POLICY "Church admins can delete pending_users"
  ON public.pending_users FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.church_id = pending_users.church_id
    AND ur.role IN ('pastor', 'secretario')
  ));

-- 2. Add vice-leader columns to cells
ALTER TABLE public.cells ADD COLUMN IF NOT EXISTS vice_leader_1_id uuid REFERENCES public.members(id);
ALTER TABLE public.cells ADD COLUMN IF NOT EXISTS vice_leader_2_id uuid REFERENCES public.members(id);

-- 3. Add decision_date to consolidation_records
ALTER TABLE public.consolidation_records ADD COLUMN IF NOT EXISTS decision_date date;