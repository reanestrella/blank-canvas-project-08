-- Worship songs table
CREATE TABLE IF NOT EXISTS public.worship_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text,
  key_signature text,
  bpm integer,
  tags text[] DEFAULT '{}',
  chord_url text,
  audio_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Worship sets (cultos/ensaios)
CREATE TABLE IF NOT EXISTS public.worship_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  ministry_id uuid NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  created_by_member_id uuid REFERENCES public.members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Worship set songs (músicas de um set)
CREATE TABLE IF NOT EXISTS public.worship_set_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  worship_set_id uuid NOT NULL REFERENCES public.worship_sets(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.worship_songs(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  played_key_override text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worship_set_id, song_id)
);