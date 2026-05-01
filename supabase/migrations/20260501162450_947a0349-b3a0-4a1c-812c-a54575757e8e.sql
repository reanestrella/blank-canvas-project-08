
CREATE TABLE public.financial_percentages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  name text NOT NULL,
  percentage numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  base text NOT NULL DEFAULT 'receita' CHECK (base IN ('receita','despesa','saldo')),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.financial_percentages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_select" ON public.financial_percentages
  FOR SELECT TO authenticated USING (public.user_belongs_to_church(church_id));

CREATE POLICY "fp_insert" ON public.financial_percentages
  FOR INSERT TO authenticated WITH CHECK (public.user_belongs_to_church(church_id));

CREATE POLICY "fp_update" ON public.financial_percentages
  FOR UPDATE TO authenticated USING (public.user_belongs_to_church(church_id))
  WITH CHECK (public.user_belongs_to_church(church_id));

CREATE POLICY "fp_delete" ON public.financial_percentages
  FOR DELETE TO authenticated USING (public.user_is_church_admin(church_id));

CREATE INDEX idx_fp_church ON public.financial_percentages(church_id);

CREATE OR REPLACE FUNCTION public.touch_financial_percentages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fp_updated
BEFORE UPDATE ON public.financial_percentages
FOR EACH ROW EXECUTE FUNCTION public.touch_financial_percentages_updated_at();
