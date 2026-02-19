
-- Adicionar políticas mais flexíveis para que usuários autenticados da igreja possam inserir dados
-- Permitir que qualquer membro da igreja possa inserir células (não apenas admin)
DROP POLICY IF EXISTS "Admin pode gerenciar células" ON public.cells;

CREATE POLICY "Usuários da igreja podem inserir células"
  ON public.cells FOR INSERT
  WITH CHECK (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Admin/Líder pode atualizar células"
  ON public.cells FOR UPDATE
  USING (church_id = get_user_church_id(auth.uid()) AND (
    is_church_admin(auth.uid(), church_id) OR 
    has_role(auth.uid(), church_id, 'lider_celula'::app_role)
  ));

CREATE POLICY "Admin pode deletar células"
  ON public.cells FOR DELETE
  USING (is_church_admin(auth.uid(), church_id));

-- Permitir que qualquer membro da igreja possa inserir ministérios (não apenas admin)
DROP POLICY IF EXISTS "Admin pode gerenciar ministérios" ON public.ministries;

CREATE POLICY "Usuários da igreja podem inserir ministérios"
  ON public.ministries FOR INSERT
  WITH CHECK (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Admin/Líder pode atualizar ministérios"
  ON public.ministries FOR UPDATE
  USING (church_id = get_user_church_id(auth.uid()) AND (
    is_church_admin(auth.uid(), church_id) OR 
    has_role(auth.uid(), church_id, 'lider_ministerio'::app_role)
  ));

CREATE POLICY "Admin pode deletar ministérios"
  ON public.ministries FOR DELETE
  USING (is_church_admin(auth.uid(), church_id));

-- Permitir que mais funções possam inserir membros
DROP POLICY IF EXISTS "Admin/Secretário pode inserir membros" ON public.members;

CREATE POLICY "Usuários da igreja podem inserir membros"
  ON public.members FOR INSERT
  WITH CHECK (church_id = get_user_church_id(auth.uid()));

-- Expandir políticas de congregações para permitir inserção
DROP POLICY IF EXISTS "Admin pode gerenciar congregações" ON public.congregations;

CREATE POLICY "Usuários da igreja podem inserir congregações"
  ON public.congregations FOR INSERT
  WITH CHECK (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Admin pode atualizar congregações"
  ON public.congregations FOR UPDATE
  USING (is_church_admin(auth.uid(), church_id));

CREATE POLICY "Admin pode deletar congregações"
  ON public.congregations FOR DELETE
  USING (is_church_admin(auth.uid(), church_id));

-- Expandir políticas de categorias financeiras
DROP POLICY IF EXISTS "Admin pode gerenciar categorias" ON public.financial_categories;

CREATE POLICY "Usuários da igreja podem inserir categorias"
  ON public.financial_categories FOR INSERT
  WITH CHECK (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Admin/Tesoureiro pode atualizar categorias"
  ON public.financial_categories FOR UPDATE
  USING (church_id = get_user_church_id(auth.uid()) AND (
    is_church_admin(auth.uid(), church_id) OR 
    has_role(auth.uid(), church_id, 'tesoureiro'::app_role)
  ));

CREATE POLICY "Admin pode deletar categorias"
  ON public.financial_categories FOR DELETE
  USING (is_church_admin(auth.uid(), church_id));

-- Criar função para inserir categorias padrão quando uma igreja é criada
CREATE OR REPLACE FUNCTION public.ensure_default_financial_categories()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.financial_categories (church_id, name, type, is_active)
    VALUES 
        (NEW.id, 'Dízimo', 'income', true),
        (NEW.id, 'Oferta', 'income', true),
        (NEW.id, 'Renda', 'income', true),
        (NEW.id, 'Voto Especial', 'income', true),
        (NEW.id, 'Outros (Entrada)', 'income', true),
        (NEW.id, 'Aluguel', 'expense', true),
        (NEW.id, 'Água/Luz', 'expense', true),
        (NEW.id, 'Salários', 'expense', true),
        (NEW.id, 'Manutenção', 'expense', true),
        (NEW.id, 'Outros (Saída)', 'expense', true)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$function$;

-- Criar trigger para categorias padrão
DROP TRIGGER IF EXISTS create_default_financial_categories ON public.churches;
CREATE TRIGGER create_default_financial_categories
    AFTER INSERT ON public.churches
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_default_financial_categories();

-- Expandir política de convites para permitir UPDATE (marcar como usado)
CREATE POLICY "Anyone can mark invitation as used"
  ON public.invitations FOR UPDATE
  USING (used_at IS NULL AND expires_at > now())
  WITH CHECK (used_at IS NOT NULL);
