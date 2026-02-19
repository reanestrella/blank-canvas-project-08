-- 1. CRIAR TABELA DE CONGREGAÇÕES
CREATE TABLE IF NOT EXISTS public.congregations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    is_main BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.congregations ENABLE ROW LEVEL SECURITY;

-- Policies for congregations
CREATE POLICY "Congregações visíveis para igreja" 
ON public.congregations 
FOR SELECT 
USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Admin pode gerenciar congregações" 
ON public.congregations 
FOR ALL 
USING (is_church_admin(auth.uid(), church_id));

-- 2. ADICIONAR NOVOS CAMPOS NA TABELA MEMBERS
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS congregation_id UUID REFERENCES public.congregations(id),
ADD COLUMN IF NOT EXISTS network TEXT,
ADD COLUMN IF NOT EXISTS age_group TEXT,
ADD COLUMN IF NOT EXISTS wedding_date DATE,
ADD COLUMN IF NOT EXISTS pastoral_notes TEXT,
ADD COLUMN IF NOT EXISTS last_attendance_date DATE,
ADD COLUMN IF NOT EXISTS inactivity_reason TEXT;

-- Add index for network filtering
CREATE INDEX IF NOT EXISTS idx_members_network ON public.members(network);
CREATE INDEX IF NOT EXISTS idx_members_congregation ON public.members(congregation_id);

-- 3. CRIAR TABELA DE HISTÓRICO ESPIRITUAL
CREATE TABLE IF NOT EXISTS public.spiritual_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- conversao, batismo, promocao_lider, acompanhamento, etc
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spiritual_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Histórico visível para igreja" 
ON public.spiritual_history 
FOR SELECT 
USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Admin/Secretário pode gerenciar histórico" 
ON public.spiritual_history 
FOR ALL 
USING (
    church_id = get_user_church_id(auth.uid()) AND 
    (is_church_admin(auth.uid(), church_id) OR has_role(auth.uid(), church_id, 'secretario'))
);

-- 4. CRIAR TABELA DE ALERTAS
CREATE TABLE IF NOT EXISTS public.member_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- novo_visitante, novo_convertido, ausencia_prolongada, aniversario
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Alertas visíveis para igreja" 
ON public.member_alerts 
FOR SELECT 
USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Sistema pode criar alertas" 
ON public.member_alerts 
FOR INSERT 
WITH CHECK (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "Admin pode gerenciar alertas" 
ON public.member_alerts 
FOR ALL 
USING (is_church_admin(auth.uid(), church_id));

-- 5. TRIGGER PARA UPDATED_AT EM CONGREGATIONS
CREATE TRIGGER update_congregations_updated_at
BEFORE UPDATE ON public.congregations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. CRIAR CONGREGAÇÃO PADRÃO PARA IGREJAS EXISTENTES (via função)
CREATE OR REPLACE FUNCTION public.ensure_default_congregation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.congregations (church_id, name, is_main, is_active)
    VALUES (NEW.id, 'Sede', true, true)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER create_default_congregation
AFTER INSERT ON public.churches
FOR EACH ROW
EXECUTE FUNCTION public.ensure_default_congregation();