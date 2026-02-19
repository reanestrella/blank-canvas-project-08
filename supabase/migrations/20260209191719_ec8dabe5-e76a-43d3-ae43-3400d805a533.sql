
-- Table for Discipleships (Discipulados)
CREATE TABLE public.discipleships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  discipler_id uuid REFERENCES public.members(id),
  disciple_id uuid NOT NULL REFERENCES public.members(id),
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'ativo',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discipleships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Secretary can manage discipleships"
  ON public.discipleships FOR ALL
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (is_church_admin(auth.uid(), church_id) OR has_role(auth.uid(), church_id, 'secretario'::app_role))
  );

CREATE POLICY "Church members can view discipleships"
  ON public.discipleships FOR SELECT
  USING (church_id = get_user_church_id(auth.uid()));

-- Table for Pastoral Visits (Visitas Pastorais)
CREATE TABLE public.pastoral_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  member_id uuid REFERENCES public.members(id),
  visitor_id uuid REFERENCES public.members(id),
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pastoral_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Secretary can manage pastoral visits"
  ON public.pastoral_visits FOR ALL
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (is_church_admin(auth.uid(), church_id) OR has_role(auth.uid(), church_id, 'secretario'::app_role))
  );

CREATE POLICY "Church members can view pastoral visits"
  ON public.pastoral_visits FOR SELECT
  USING (church_id = get_user_church_id(auth.uid()));

-- Table for Pastoral Office / Counseling (Gabinete Pastoral)
CREATE TABLE public.pastoral_counseling (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  member_id uuid REFERENCES public.members(id),
  counselor_id uuid REFERENCES public.members(id),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  session_type text NOT NULL DEFAULT 'aconselhamento',
  notes text,
  is_private boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pastoral_counseling ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Secretary can manage counseling"
  ON public.pastoral_counseling FOR ALL
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (is_church_admin(auth.uid(), church_id) OR has_role(auth.uid(), church_id, 'secretario'::app_role))
  );

-- Table for Reminders (Lembretes)
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  member_id uuid REFERENCES public.members(id),
  assigned_to uuid,
  due_date date,
  reminder_type text NOT NULL DEFAULT 'geral',
  title text NOT NULL,
  description text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Secretary can manage reminders"
  ON public.reminders FOR ALL
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (is_church_admin(auth.uid(), church_id) OR has_role(auth.uid(), church_id, 'secretario'::app_role))
  );

CREATE POLICY "Church members can view their reminders"
  ON public.reminders FOR SELECT
  USING (church_id = get_user_church_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_discipleships_updated_at
  BEFORE UPDATE ON public.discipleships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pastoral_visits_updated_at
  BEFORE UPDATE ON public.pastoral_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pastoral_counseling_updated_at
  BEFORE UPDATE ON public.pastoral_counseling
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
