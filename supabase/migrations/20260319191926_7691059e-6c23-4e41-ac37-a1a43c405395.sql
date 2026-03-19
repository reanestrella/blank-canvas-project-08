
-- Devotionals table for daily devotionals
CREATE TABLE IF NOT EXISTS public.devotionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  devotional_date date NOT NULL,
  title text NOT NULL,
  bible_reference text,
  content text NOT NULL,
  application text,
  prayer text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(church_id, devotional_date)
);

ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own church devotionals"
  ON public.devotionals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = devotionals.church_id));

CREATE POLICY "Admins can manage devotionals"
  ON public.devotionals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = devotionals.church_id AND ur.role = 'pastor'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = devotionals.church_id AND ur.role = 'pastor'));

-- Prayer requests table (drop old if exists to recreate properly)
DROP TABLE IF EXISTS public.prayer_requests CASCADE;

CREATE TABLE public.prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid,
  member_name text,
  contact text,
  title text NOT NULL,
  description text,
  category text DEFAULT 'geral',
  urgency text DEFAULT 'normal',
  is_anonymous boolean DEFAULT false,
  is_public boolean DEFAULT false,
  status text DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public or own prayer requests"
  ON public.prayer_requests FOR SELECT TO authenticated
  USING (
    (is_public = true AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = prayer_requests.church_id))
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = prayer_requests.church_id AND ur.role = 'pastor')
  );

CREATE POLICY "Users can insert prayer requests"
  ON public.prayer_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = prayer_requests.church_id));

CREATE POLICY "Users can update own prayer requests"
  ON public.prayer_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = prayer_requests.church_id AND ur.role = 'pastor'))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = prayer_requests.church_id AND ur.role = 'pastor'));

CREATE POLICY "Admins can delete prayer requests"
  ON public.prayer_requests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = prayer_requests.church_id AND ur.role = 'pastor'));
