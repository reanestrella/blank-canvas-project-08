-- Add is_baptized boolean to members table for explicit baptism tracking
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_baptized boolean NOT NULL DEFAULT false;

-- Backfill: members with baptism_date are baptized
UPDATE public.members SET is_baptized = true WHERE baptism_date IS NOT NULL;

-- Add birth_date to pending_users if not exists
ALTER TABLE public.pending_users ADD COLUMN IF NOT EXISTS birth_date date;

-- Add linked_member_id to pending_users for linking to existing members
ALTER TABLE public.pending_users ADD COLUMN IF NOT EXISTS linked_member_id uuid REFERENCES public.members(id);
