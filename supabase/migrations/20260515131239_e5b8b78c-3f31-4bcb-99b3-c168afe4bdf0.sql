ALTER TABLE public.financial_payables
  ADD COLUMN IF NOT EXISTS recurrence_interval_days integer;

ALTER TABLE public.financial_payables
  DROP CONSTRAINT IF EXISTS financial_payables_recurrence_check;

ALTER TABLE public.financial_payables
  ADD CONSTRAINT financial_payables_recurrence_check
  CHECK (recurrence IN ('nenhuma','semanal','mensal','anual','personalizada'));

CREATE INDEX IF NOT EXISTS idx_financial_payables_recurrence_chain
  ON public.financial_payables(church_id, recurrence, due_date)
  WHERE recurrence <> 'nenhuma';