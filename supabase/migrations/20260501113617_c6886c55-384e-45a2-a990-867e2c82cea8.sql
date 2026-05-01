
-- Add Asaas-related columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Payment history for Asaas
CREATE TABLE IF NOT EXISTS public.asaas_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  user_id uuid NOT NULL,
  asaas_payment_id text NOT NULL UNIQUE,
  asaas_customer_id text,
  billing_type text NOT NULL,
  plan text NOT NULL,
  value numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invoice_url text,
  pix_qr_code text,
  pix_payload text,
  bank_slip_url text,
  due_date date,
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asaas_payments_church ON public.asaas_payments(church_id);
CREATE INDEX IF NOT EXISTS idx_asaas_payments_user ON public.asaas_payments(user_id);

ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asaas_payments_admin_select" ON public.asaas_payments;
CREATE POLICY "asaas_payments_admin_select" ON public.asaas_payments
  FOR SELECT TO authenticated
  USING (user_belongs_to_church(church_id));

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_asaas_payments_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_asaas_payments ON public.asaas_payments;
CREATE TRIGGER trg_touch_asaas_payments
  BEFORE UPDATE ON public.asaas_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_asaas_payments_updated_at();
