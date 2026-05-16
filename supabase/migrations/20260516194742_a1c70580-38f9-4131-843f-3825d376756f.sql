
-- Add customization columns
ALTER TABLE public.financial_categories
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Allow type 'ambos' (receita + despesa)
ALTER TABLE public.financial_categories
  DROP CONSTRAINT IF EXISTS financial_categories_type_check;
ALTER TABLE public.financial_categories
  ADD CONSTRAINT financial_categories_type_check
  CHECK (type IN ('receita', 'despesa', 'ambos'));

-- Mark existing default categories (those that match the default seed names) as system
UPDATE public.financial_categories
SET is_system = true
WHERE name IN (
  'Dízimos','Ofertas','Ofertas de Célula','Campanhas','Eventos','Doações','Contribuições',
  'Vendas','Inscrições','Aluguel recebido','Rendimentos','Entrada extraordinária','Outros (Receita)',
  'Água','Energia','Internet','Aluguel','Manutenção','Limpeza','Material de escritório',
  'Material infantil','Sonorização','Mídia','Instrumentos','Ajuda social','Missões',
  'Eventos (Despesa)','Transporte','Alimentação','Salários / ajuda de custo','Impostos / taxas',
  'Reforma / construção','Compras gerais','Outros (Despesa)'
);

-- Tighten RLS: only church admins (pastor/tesoureiro/secretario) can create/update categories
DROP POLICY IF EXISTS financial_categories_tenant_insert ON public.financial_categories;
DROP POLICY IF EXISTS financial_categories_tenant_update ON public.financial_categories;

CREATE POLICY financial_categories_admin_insert ON public.financial_categories
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_church_admin(church_id));

CREATE POLICY financial_categories_admin_update ON public.financial_categories
  FOR UPDATE TO authenticated
  USING (public.user_is_church_admin(church_id))
  WITH CHECK (public.user_is_church_admin(church_id));

-- Prevent deleting system categories (DELETE policy already restricted to admins)
CREATE OR REPLACE FUNCTION public.prevent_delete_system_category()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_system = true THEN
    RAISE EXCEPTION 'Categorias padrão do sistema não podem ser excluídas. Desative-a em vez disso.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_system_category ON public.financial_categories;
CREATE TRIGGER trg_prevent_delete_system_category
  BEFORE DELETE ON public.financial_categories
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_system_category();

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_touch_financial_categories ON public.financial_categories;
CREATE TRIGGER trg_touch_financial_categories
  BEFORE UPDATE ON public.financial_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_financial_payables_updated_at();
