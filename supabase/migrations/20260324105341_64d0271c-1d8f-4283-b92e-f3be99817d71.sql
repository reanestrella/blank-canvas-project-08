
-- Discipleship logs table for tracking interactions
CREATE TABLE public.discipleship_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipleship_id uuid NOT NULL REFERENCES public.discipleships(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discipleship_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church members can manage discipleship_logs"
ON public.discipleship_logs FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = discipleship_logs.church_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = discipleship_logs.church_id)
);
