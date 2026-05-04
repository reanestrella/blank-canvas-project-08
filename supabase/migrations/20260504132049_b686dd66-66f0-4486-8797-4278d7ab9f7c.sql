-- 1) Adicionar flag de transferência em transactions
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS is_transfer boolean NOT NULL DEFAULT false;

-- 2) Tabela de transferências entre contas
CREATE TABLE IF NOT EXISTS public.financial_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  from_account_id uuid NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
  to_account_id uuid NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  out_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  in_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_transfers_church ON public.financial_transfers(church_id);
CREATE INDEX IF NOT EXISTS idx_financial_transfers_date ON public.financial_transfers(transfer_date);

ALTER TABLE public.financial_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY ft_select ON public.financial_transfers FOR SELECT TO authenticated
  USING (user_belongs_to_church(church_id));
CREATE POLICY ft_insert ON public.financial_transfers FOR INSERT TO authenticated
  WITH CHECK (user_belongs_to_church(church_id));
CREATE POLICY ft_update ON public.financial_transfers FOR UPDATE TO authenticated
  USING (user_belongs_to_church(church_id))
  WITH CHECK (user_belongs_to_church(church_id));
CREATE POLICY ft_delete ON public.financial_transfers FOR DELETE TO authenticated
  USING (user_is_church_admin(church_id));

-- 3) Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS public.financial_payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  category_id uuid REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
  recurrence text NOT NULL DEFAULT 'nenhuma' CHECK (recurrence IN ('nenhuma','semanal','mensal','anual')),
  paid_at date,
  paid_transaction_id uuid REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  parent_payable_id uuid REFERENCES public.financial_payables(id) ON DELETE SET NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_payables_church ON public.financial_payables(church_id);
CREATE INDEX IF NOT EXISTS idx_financial_payables_due ON public.financial_payables(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_payables_status ON public.financial_payables(status);

ALTER TABLE public.financial_payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY fp2_select ON public.financial_payables FOR SELECT TO authenticated
  USING (user_belongs_to_church(church_id));
CREATE POLICY fp2_insert ON public.financial_payables FOR INSERT TO authenticated
  WITH CHECK (user_belongs_to_church(church_id));
CREATE POLICY fp2_update ON public.financial_payables FOR UPDATE TO authenticated
  USING (user_belongs_to_church(church_id))
  WITH CHECK (user_belongs_to_church(church_id));
CREATE POLICY fp2_delete ON public.financial_payables FOR DELETE TO authenticated
  USING (user_is_church_admin(church_id));

-- 4) Trigger para updated_at em payables
CREATE OR REPLACE FUNCTION public.touch_financial_payables_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_payables ON public.financial_payables;
CREATE TRIGGER trg_touch_payables
BEFORE UPDATE ON public.financial_payables
FOR EACH ROW EXECUTE FUNCTION public.touch_financial_payables_updated_at();

-- 5) RPC atômica para criar transferência (2 transactions + 1 transfer)
CREATE OR REPLACE FUNCTION public.create_account_transfer(
  p_church_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_date date,
  p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_out_id uuid;
  v_in_id uuid;
  v_transfer_id uuid;
  v_desc text;
BEGIN
  IF NOT user_belongs_to_church(p_church_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'same_account';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  v_desc := COALESCE(NULLIF(p_description, ''), 'Transferência entre contas');

  INSERT INTO public.financial_transactions
    (church_id, type, description, amount, transaction_date, account_id, is_transfer, created_by)
  VALUES
    (p_church_id, 'despesa', v_desc || ' (saída)', p_amount, p_date, p_from_account_id, true, auth.uid())
  RETURNING id INTO v_out_id;

  INSERT INTO public.financial_transactions
    (church_id, type, description, amount, transaction_date, account_id, is_transfer, created_by)
  VALUES
    (p_church_id, 'receita', v_desc || ' (entrada)', p_amount, p_date, p_to_account_id, true, auth.uid())
  RETURNING id INTO v_in_id;

  INSERT INTO public.financial_transfers
    (church_id, from_account_id, to_account_id, amount, transfer_date, description, out_transaction_id, in_transaction_id, created_by)
  VALUES
    (p_church_id, p_from_account_id, p_to_account_id, p_amount, p_date, p_description, v_out_id, v_in_id, auth.uid())
  RETURNING id INTO v_transfer_id;

  RETURN v_transfer_id;
END;
$$;