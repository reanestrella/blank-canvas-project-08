
-- 1) Trigger to auto-update financial_accounts.current_balance
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      UPDATE financial_accounts
      SET current_balance = COALESCE(initial_balance, 0) + COALESCE((
        SELECT SUM(CASE WHEN type = 'receita' THEN amount ELSE -amount END)
        FROM financial_transactions
        WHERE account_id = OLD.account_id
      ), 0),
      updated_at = now()
      WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;
  END IF;

  -- For INSERT and UPDATE
  -- If account changed on UPDATE, recalculate old account
  IF TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id AND OLD.account_id IS NOT NULL THEN
    UPDATE financial_accounts
    SET current_balance = COALESCE(initial_balance, 0) + COALESCE((
      SELECT SUM(CASE WHEN type = 'receita' THEN amount ELSE -amount END)
      FROM financial_transactions
      WHERE account_id = OLD.account_id
    ), 0),
    updated_at = now()
    WHERE id = OLD.account_id;
  END IF;

  -- Recalculate new/current account
  IF NEW.account_id IS NOT NULL THEN
    UPDATE financial_accounts
    SET current_balance = COALESCE(initial_balance, 0) + COALESCE((
      SELECT SUM(CASE WHEN type = 'receita' THEN amount ELSE -amount END)
      FROM financial_transactions
      WHERE account_id = NEW.account_id
    ), 0),
    updated_at = now()
    WHERE id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_account_balance ON public.financial_transactions;
CREATE TRIGGER trg_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- 2) Table for linking worship songs to ministry schedules
CREATE TABLE IF NOT EXISTS public.schedule_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL REFERENCES public.ministry_schedules(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.worship_songs(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, song_id)
);

ALTER TABLE public.schedule_songs ENABLE ROW LEVEL SECURITY;

-- 3) Recalculate all existing account balances now
UPDATE financial_accounts fa
SET current_balance = COALESCE(fa.initial_balance, 0) + COALESCE((
  SELECT SUM(CASE WHEN ft.type = 'receita' THEN ft.amount ELSE -ft.amount END)
  FROM financial_transactions ft
  WHERE ft.account_id = fa.id
), 0),
updated_at = now();
