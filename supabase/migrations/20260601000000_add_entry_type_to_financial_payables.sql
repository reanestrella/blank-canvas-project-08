ALTER TABLE financial_payables
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'pagar'
    CHECK (entry_type IN ('pagar', 'receber'));
