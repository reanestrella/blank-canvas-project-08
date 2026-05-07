
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT NULL;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.cell_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cell_id uuid NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cell_id)
);

CREATE INDEX IF NOT EXISTS idx_cell_leaders_user ON public.cell_leaders(user_id);
CREATE INDEX IF NOT EXISTS idx_cell_leaders_cell ON public.cell_leaders(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_leaders_church ON public.cell_leaders(church_id);

ALTER TABLE public.cell_leaders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cell_leaders_select_church" ON public.cell_leaders;
DROP POLICY IF EXISTS "cell_leaders_admin_insert" ON public.cell_leaders;
DROP POLICY IF EXISTS "cell_leaders_admin_update" ON public.cell_leaders;
DROP POLICY IF EXISTS "cell_leaders_admin_delete" ON public.cell_leaders;

CREATE POLICY "cell_leaders_select_church" ON public.cell_leaders FOR SELECT
  USING (public.user_belongs_to_church(church_id));
CREATE POLICY "cell_leaders_admin_insert" ON public.cell_leaders FOR INSERT
  WITH CHECK (public.user_is_church_admin(church_id));
CREATE POLICY "cell_leaders_admin_update" ON public.cell_leaders FOR UPDATE
  USING (public.user_is_church_admin(church_id));
CREATE POLICY "cell_leaders_admin_delete" ON public.cell_leaders FOR DELETE
  USING (public.user_is_church_admin(church_id));

CREATE OR REPLACE FUNCTION public.user_has_permission(_module text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (
        role = 'pastor'
        OR permissions IS NULL
        OR _module = ANY(permissions)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_leads_cell(_cell_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cell_leaders
    WHERE user_id = auth.uid() AND cell_id = _cell_id
  ) OR EXISTS (
    SELECT 1 FROM public.cells c
    WHERE c.id = _cell_id
      AND (c.leader_user_id = auth.uid() OR c.supervisor_user_id = auth.uid())
  );
$$;
