
-- Lote 2: Preserve histórico de visitantes
ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS first_visit_date date;

-- Backfill: usar created_at para todos os membros que ainda não têm
UPDATE public.members 
SET first_visit_date = created_at::date 
WHERE first_visit_date IS NULL;

-- Trigger para preencher automaticamente em novos cadastros
CREATE OR REPLACE FUNCTION public.set_first_visit_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.first_visit_date IS NULL THEN
    NEW.first_visit_date := COALESCE(NEW.created_at::date, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_first_visit_date ON public.members;
CREATE TRIGGER trg_set_first_visit_date
  BEFORE INSERT ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_first_visit_date();

-- Lote 4: Parcelamento em contas a pagar
ALTER TABLE public.financial_payables
  ADD COLUMN IF NOT EXISTS installment_number int,
  ADD COLUMN IF NOT EXISTS installment_total int,
  ADD COLUMN IF NOT EXISTS installment_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_financial_payables_installment_group 
  ON public.financial_payables(installment_group_id) 
  WHERE installment_group_id IS NOT NULL;
