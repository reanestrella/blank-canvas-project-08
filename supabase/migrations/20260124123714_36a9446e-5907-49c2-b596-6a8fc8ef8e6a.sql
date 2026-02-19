-- 1. Corrigir função ensure_default_financial_categories com valores corretos
CREATE OR REPLACE FUNCTION public.ensure_default_financial_categories()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.financial_categories (church_id, name, type, is_active)
    VALUES 
        (NEW.id, 'Dízimo', 'receita', true),
        (NEW.id, 'Oferta', 'receita', true),
        (NEW.id, 'Renda', 'receita', true),
        (NEW.id, 'Voto Especial', 'receita', true),
        (NEW.id, 'Outros (Entrada)', 'receita', true),
        (NEW.id, 'Aluguel', 'despesa', true),
        (NEW.id, 'Água/Luz', 'despesa', true),
        (NEW.id, 'Salários', 'despesa', true),
        (NEW.id, 'Manutenção', 'despesa', true),
        (NEW.id, 'Outros (Saída)', 'despesa', true)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

-- 2. Criar categorias padrão para igrejas existentes que não têm
INSERT INTO public.financial_categories (church_id, name, type, is_active)
SELECT c.id, cat.name, cat.type, true
FROM public.churches c
CROSS JOIN (
    VALUES 
        ('Dízimo', 'receita'),
        ('Oferta', 'receita'),
        ('Renda', 'receita'),
        ('Voto Especial', 'receita'),
        ('Outros (Entrada)', 'receita'),
        ('Aluguel', 'despesa'),
        ('Água/Luz', 'despesa'),
        ('Salários', 'despesa'),
        ('Manutenção', 'despesa'),
        ('Outros (Saída)', 'despesa')
) AS cat(name, type)
WHERE NOT EXISTS (
    SELECT 1 FROM public.financial_categories fc 
    WHERE fc.church_id = c.id AND fc.name = cat.name
);

-- 3. Corrigir usuários órfãos existentes
DO $$
DECLARE
  _user RECORD;
  _church_id UUID;
BEGIN
  FOR _user IN 
    SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.id IS NULL
  LOOP
    -- Criar igreja para o usuário
    INSERT INTO public.churches (name) 
    VALUES ('Igreja de ' || _user.full_name)
    RETURNING id INTO _church_id;
    
    -- Criar perfil
    INSERT INTO public.profiles (user_id, church_id, full_name, email)
    VALUES (_user.id, _church_id, _user.full_name, _user.email);
    
    -- Atribuir role de pastor
    INSERT INTO public.user_roles (user_id, church_id, role)
    VALUES (_user.id, _church_id, 'pastor');
  END LOOP;
END $$;