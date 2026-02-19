-- 1. TABELAS PARA OS 4 PILARES DO LÍDER DE CÉLULA

-- Pedidos de Oração da Célula
CREATE TABLE public.cell_prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    request TEXT NOT NULL,
    is_answered BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE,
    leader_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cuidado Pastoral - Notas do Líder sobre membros
CREATE TABLE public.cell_pastoral_care (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    care_type TEXT NOT NULL CHECK (care_type IN ('visita', 'ligacao', 'mensagem', 'oracao', 'outro')),
    notes TEXT,
    care_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Acompanhamento de Visitantes/Evangelismo da Célula
CREATE TABLE public.cell_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invited_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    accepted_christ BOOLEAN DEFAULT FALSE,
    follow_up_status TEXT DEFAULT 'pendente' CHECK (follow_up_status IN ('pendente', 'em_acompanhamento', 'integrado', 'desistente')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Formação de Líderes - Membros em potencial
CREATE TABLE public.cell_leadership_development (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    potential_level TEXT DEFAULT 'identificado' CHECK (potential_level IN ('identificado', 'em_treinamento', 'pronto', 'lancado')),
    notes TEXT,
    identified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TABELAS FINANCEIRAS ADICIONAIS

-- Contas Financeiras
CREATE TABLE public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('carteira', 'conta_bancaria', 'poupanca', 'outro')),
    bank_name TEXT,
    initial_balance NUMERIC(10,2) DEFAULT 0,
    current_balance NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    network TEXT,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campanhas Financeiras
CREATE TABLE public.financial_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    goal_amount NUMERIC(10,2),
    current_amount NUMERIC(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar account_id e campaign_id às transações
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.financial_campaigns(id) ON DELETE SET NULL;

-- 3. CENTRAL DE CONSOLIDAÇÃO

-- Acompanhamento de Consolidação
CREATE TABLE public.consolidation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    consolidator_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'contato' CHECK (status IN ('contato', 'acompanhamento', 'integracao', 'concluido', 'desistente')),
    contact_date DATE,
    first_visit_date DATE,
    cell_integration_date DATE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. HABILITAR RLS

ALTER TABLE public.cell_prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_pastoral_care ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_leadership_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consolidation_records ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS

-- Cell Prayer Requests - Admins e Líderes
CREATE POLICY "Admins can manage cell prayer requests" ON public.cell_prayer_requests
FOR ALL USING (public.is_church_admin(auth.uid(), church_id));

CREATE POLICY "Cell leaders can manage their cell prayer requests" ON public.cell_prayer_requests
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.cells c
        WHERE c.id = cell_id
        AND c.leader_id = public.get_user_member_id(auth.uid())
    )
);

-- Cell Pastoral Care
CREATE POLICY "Admins can manage cell pastoral care" ON public.cell_pastoral_care
FOR ALL USING (public.is_church_admin(auth.uid(), church_id));

CREATE POLICY "Cell leaders can manage their cell pastoral care" ON public.cell_pastoral_care
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.cells c
        WHERE c.id = cell_id
        AND c.leader_id = public.get_user_member_id(auth.uid())
    )
);

-- Cell Visitors
CREATE POLICY "Admins can manage cell visitors" ON public.cell_visitors
FOR ALL USING (public.is_church_admin(auth.uid(), church_id));

CREATE POLICY "Cell leaders can manage their cell visitors" ON public.cell_visitors
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.cells c
        WHERE c.id = cell_id
        AND c.leader_id = public.get_user_member_id(auth.uid())
    )
);

-- Cell Leadership Development
CREATE POLICY "Admins can manage leadership development" ON public.cell_leadership_development
FOR ALL USING (public.is_church_admin(auth.uid(), church_id));

CREATE POLICY "Cell leaders can manage their cell leadership development" ON public.cell_leadership_development
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.cells c
        WHERE c.id = cell_id
        AND c.leader_id = public.get_user_member_id(auth.uid())
    )
);

-- Financial Accounts
CREATE POLICY "Admins can manage financial accounts" ON public.financial_accounts
FOR ALL USING (public.is_church_admin(auth.uid(), church_id));

CREATE POLICY "Tesoureiros can manage financial accounts" ON public.financial_accounts
FOR ALL USING (public.has_role(auth.uid(), church_id, 'tesoureiro'));

-- Financial Campaigns
CREATE POLICY "Admins can manage financial campaigns" ON public.financial_campaigns
FOR ALL USING (public.is_church_admin(auth.uid(), church_id));

CREATE POLICY "Tesoureiros can manage financial campaigns" ON public.financial_campaigns
FOR ALL USING (public.has_role(auth.uid(), church_id, 'tesoureiro'));

-- Consolidation Records
CREATE POLICY "Admins can manage consolidation records" ON public.consolidation_records
FOR ALL USING (public.is_church_admin(auth.uid(), church_id));

CREATE POLICY "Consolidacao role can manage consolidation records" ON public.consolidation_records
FOR ALL USING (public.has_role(auth.uid(), church_id, 'consolidacao'));

-- 6. TRIGGERS PARA updated_at

CREATE TRIGGER update_cell_prayer_requests_updated_at
    BEFORE UPDATE ON public.cell_prayer_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cell_visitors_updated_at
    BEFORE UPDATE ON public.cell_visitors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cell_leadership_development_updated_at
    BEFORE UPDATE ON public.cell_leadership_development
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_accounts_updated_at
    BEFORE UPDATE ON public.financial_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_campaigns_updated_at
    BEFORE UPDATE ON public.financial_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consolidation_records_updated_at
    BEFORE UPDATE ON public.consolidation_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();