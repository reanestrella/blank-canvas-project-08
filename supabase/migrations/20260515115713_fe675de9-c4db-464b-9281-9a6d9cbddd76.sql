
-- Add origin_type to members for accurate visitor counting
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS origin_type text NOT NULL DEFAULT 'unknown'
  CHECK (origin_type IN (
    'real_visitor','manual_member','spreadsheet_import',
    'system_migration','app_signup','decision','unknown'
  ));

CREATE INDEX IF NOT EXISTS idx_members_origin_type ON public.members(church_id, origin_type);

-- Backfill: all existing members predate this feature → system_migration by default
UPDATE public.members
   SET origin_type = 'system_migration'
 WHERE origin_type = 'unknown';

-- Mark as real_visitor anyone who has a consolidation_record with a real visit_date
UPDATE public.members m
   SET origin_type = 'real_visitor'
  FROM public.consolidation_records cr
 WHERE cr.member_id = m.id
   AND cr.visit_date IS NOT NULL
   AND m.origin_type = 'system_migration';

-- Church-level toggle: ignore imported/migrated members in visitor metrics (default ON)
ALTER TABLE public.church_settings
  ADD COLUMN IF NOT EXISTS ignore_imported_in_metrics boolean NOT NULL DEFAULT true;
