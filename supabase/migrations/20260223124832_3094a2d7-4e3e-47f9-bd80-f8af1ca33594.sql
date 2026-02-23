
-- Table for AI error logs
CREATE TABLE public.ai_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  provider_status integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own church error logs"
  ON public.ai_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can read all error logs"
  ON public.ai_error_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM system_admins sa WHERE sa.user_id = auth.uid() AND sa.active = true));

-- Table for cached AI dashboard reports
CREATE TABLE public.ai_dashboard_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  period text NOT NULL DEFAULT '7d',
  report_text text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.ai_dashboard_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own church reports"
  ON public.ai_dashboard_reports FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = ai_dashboard_reports.church_id));

CREATE POLICY "Users can insert own church reports"
  ON public.ai_dashboard_reports FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = ai_dashboard_reports.church_id));

-- RLS for ai_chat_history (currently has none)
CREATE POLICY "Users can insert own chat history"
  ON public.ai_chat_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own chat history"
  ON public.ai_chat_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
