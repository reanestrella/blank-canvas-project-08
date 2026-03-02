-- Create ministry_roles table (functions/positions within a ministry)
CREATE TABLE IF NOT EXISTS public.ministry_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  ministry_id uuid NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT '👤',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create ministry_role_members table (people assigned to roles)
CREATE TABLE IF NOT EXISTS public.ministry_role_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  ministry_role_id uuid NOT NULL REFERENCES public.ministry_roles(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ministry_role_id, member_id, church_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ministry_roles_ministry ON public.ministry_roles(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_roles_church ON public.ministry_roles(church_id);
CREATE INDEX IF NOT EXISTS idx_ministry_role_members_role ON public.ministry_role_members(ministry_role_id);
CREATE INDEX IF NOT EXISTS idx_ministry_role_members_member ON public.ministry_role_members(member_id);
CREATE INDEX IF NOT EXISTS idx_ministry_role_members_church ON public.ministry_role_members(church_id);