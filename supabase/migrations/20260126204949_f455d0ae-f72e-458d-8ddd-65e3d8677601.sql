-- Adicionar member_id ao profile para vincular usuário a membro
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.members(id) ON DELETE SET NULL;

-- Criar índice para member_id
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON public.profiles(member_id);

-- Função para obter o member_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_member_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT member_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Atualizar RLS de células para líderes verem apenas suas células
DROP POLICY IF EXISTS "Líder de célula pode ver sua célula" ON public.cells;

CREATE POLICY "Líder de célula pode ver sua célula"
  ON public.cells FOR SELECT
  USING (
    church_id = get_user_church_id(auth.uid()) AND (
      is_church_admin(auth.uid(), church_id) OR
      has_role(auth.uid(), church_id, 'consolidacao'::app_role) OR
      (has_role(auth.uid(), church_id, 'lider_celula'::app_role) AND leader_id = get_user_member_id(auth.uid()))
    )
  );

-- Permitir que admin veja todas as células
DROP POLICY IF EXISTS "Admin pode ver todas as células" ON public.cells;

CREATE POLICY "Admin e consolidacao pode ver todas células"
  ON public.cells FOR SELECT
  USING (
    church_id = get_user_church_id(auth.uid()) AND (
      is_church_admin(auth.uid(), church_id) OR
      has_role(auth.uid(), church_id, 'consolidacao'::app_role)
    )
  );