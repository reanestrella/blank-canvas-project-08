ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hide_financial boolean NOT NULL DEFAULT false;