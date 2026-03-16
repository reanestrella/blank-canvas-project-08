-- Problem 1: Drop the restrictive CHECK constraint on user_roles that blocks network_admin/network_finance
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- The enum app_role already has these values, so the column type constraint is sufficient.
-- But let's verify and add them to enum if missing (idempotent):
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'network_admin' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'network_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'network_finance' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'network_finance';
  END IF;
END$$;

-- Problem 5 (Consolidation): Add visit_count and last_visit_date to consolidation_records
ALTER TABLE public.consolidation_records 
  ADD COLUMN IF NOT EXISTS visit_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_visit_date date;