-- Enum para roles de usuários
CREATE TYPE public.app_role AS ENUM ('pastor', 'tesoureiro', 'secretario', 'lider_celula', 'lider_ministerio', 'consolidacao', 'membro');

-- Enum para status espiritual
CREATE TYPE public.spiritual_status AS ENUM ('visitante', 'novo_convertido', 'membro', 'lider', 'discipulador');

-- Tabela de Igrejas (multi-tenant)
CREATE TABLE public.churches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'essencial', 'avancado')),
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Perfis de Usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Roles separada (RBAC seguro)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, church_id, role)
);

-- Tabela de Membros (Secretaria)
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  gender TEXT CHECK (gender IN ('M', 'F')),
  marital_status TEXT,
  spiritual_status spiritual_status NOT NULL DEFAULT 'visitante',
  baptism_date DATE,
  baptism_location TEXT,
  conversion_date DATE,
  notes TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Células
CREATE TABLE public.cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  network TEXT,
  address TEXT,
  day_of_week TEXT,
  time TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Membros das Células
CREATE TABLE public.cell_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cell_id, member_id)
);

-- Relatórios Semanais de Células
CREATE TABLE public.cell_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL,
  attendance INTEGER NOT NULL DEFAULT 0,
  visitors INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  offering DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Ministérios
CREATE TABLE public.ministries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voluntários de Ministérios
CREATE TABLE public.ministry_volunteers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (ministry_id, member_id)
);

-- Escalas de Ministérios
CREATE TABLE public.ministry_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  event_date DATE NOT NULL,
  event_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voluntários escalados
CREATE TABLE public.schedule_volunteers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES public.ministry_schedules(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  role TEXT,
  confirmed BOOLEAN DEFAULT false,
  UNIQUE (schedule_id, member_id)
);

-- Categorias Financeiras
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transações Financeiras
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Eventos
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inscrições em Eventos
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed BOOLEAN DEFAULT false,
  UNIQUE (event_id, member_id)
);

-- Cursos e EBD
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  track TEXT CHECK (track IN ('novo_convertido', 'discipulado', 'lideranca', 'ebd', 'outros')),
  teacher_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alunos dos Cursos
CREATE TABLE public.course_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (course_id, member_id)
);

-- Pedidos de Oração
CREATE TABLE public.prayer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  request TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Avisos da Igreja
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles app_role[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para verificar role do usuário (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _church_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND church_id = _church_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin/pastor
CREATE OR REPLACE FUNCTION public.is_church_admin(_user_id UUID, _church_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND church_id = _church_id
      AND role = 'pastor'
  )
$$;

-- Função para obter church_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_church_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON public.churches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON public.cells FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies para Churches
CREATE POLICY "Usuários podem ver sua igreja" ON public.churches FOR SELECT USING (
  id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Admin pode atualizar igreja" ON public.churches FOR UPDATE USING (
  public.is_church_admin(auth.uid(), id)
);

-- RLS Policies para Profiles
CREATE POLICY "Usuários podem ver perfis da mesma igreja" ON public.profiles FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Usuário pode criar próprio perfil" ON public.profiles FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Usuário pode atualizar próprio perfil" ON public.profiles FOR UPDATE USING (
  user_id = auth.uid()
);

-- RLS Policies para User Roles (apenas admin gerencia)
CREATE POLICY "Usuários podem ver roles da mesma igreja" ON public.user_roles FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Admin pode gerenciar roles" ON public.user_roles FOR ALL USING (
  public.is_church_admin(auth.uid(), church_id)
);

-- RLS Policies para Members
CREATE POLICY "Membros da mesma igreja podem ver" ON public.members FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Admin/Secretário pode inserir membros" ON public.members FOR INSERT WITH CHECK (
  church_id = public.get_user_church_id(auth.uid()) AND (
    public.is_church_admin(auth.uid(), church_id) OR
    public.has_role(auth.uid(), church_id, 'secretario')
  )
);

CREATE POLICY "Admin/Secretário pode atualizar membros" ON public.members FOR UPDATE USING (
  church_id = public.get_user_church_id(auth.uid()) AND (
    public.is_church_admin(auth.uid(), church_id) OR
    public.has_role(auth.uid(), church_id, 'secretario')
  )
);

CREATE POLICY "Admin pode deletar membros" ON public.members FOR DELETE USING (
  public.is_church_admin(auth.uid(), church_id)
);

-- RLS Policies para Cells
CREATE POLICY "Células visíveis para igreja" ON public.cells FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Admin pode gerenciar células" ON public.cells FOR ALL USING (
  public.is_church_admin(auth.uid(), church_id)
);

-- RLS Policies para Cell Members
CREATE POLICY "Membros de células visíveis" ON public.cell_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cells WHERE id = cell_id AND church_id = public.get_user_church_id(auth.uid()))
);

CREATE POLICY "Admin/Líder pode gerenciar membros célula" ON public.cell_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.cells c 
    WHERE c.id = cell_id 
    AND c.church_id = public.get_user_church_id(auth.uid())
    AND (
      public.is_church_admin(auth.uid(), c.church_id) OR
      public.has_role(auth.uid(), c.church_id, 'lider_celula')
    )
  )
);

-- RLS Policies para Cell Reports
CREATE POLICY "Relatórios visíveis para igreja" ON public.cell_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cells WHERE id = cell_id AND church_id = public.get_user_church_id(auth.uid()))
);

CREATE POLICY "Líder/Admin pode criar relatórios" ON public.cell_reports FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cells c 
    WHERE c.id = cell_id 
    AND c.church_id = public.get_user_church_id(auth.uid())
  )
);

-- RLS Policies para Financial Transactions
CREATE POLICY "Transações visíveis para tesoureiro/admin" ON public.financial_transactions FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid()) AND (
    public.is_church_admin(auth.uid(), church_id) OR
    public.has_role(auth.uid(), church_id, 'tesoureiro')
  )
);

CREATE POLICY "Tesoureiro/Admin pode inserir transações" ON public.financial_transactions FOR INSERT WITH CHECK (
  church_id = public.get_user_church_id(auth.uid()) AND (
    public.is_church_admin(auth.uid(), church_id) OR
    public.has_role(auth.uid(), church_id, 'tesoureiro')
  )
);

CREATE POLICY "Tesoureiro/Admin pode atualizar transações" ON public.financial_transactions FOR UPDATE USING (
  church_id = public.get_user_church_id(auth.uid()) AND (
    public.is_church_admin(auth.uid(), church_id) OR
    public.has_role(auth.uid(), church_id, 'tesoureiro')
  )
);

CREATE POLICY "Admin pode deletar transações" ON public.financial_transactions FOR DELETE USING (
  public.is_church_admin(auth.uid(), church_id)
);

-- RLS Policies para Financial Categories
CREATE POLICY "Categorias visíveis para tesoureiro/admin" ON public.financial_categories FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid()) AND (
    public.is_church_admin(auth.uid(), church_id) OR
    public.has_role(auth.uid(), church_id, 'tesoureiro')
  )
);

CREATE POLICY "Admin pode gerenciar categorias" ON public.financial_categories FOR ALL USING (
  public.is_church_admin(auth.uid(), church_id)
);

-- RLS Policies para Ministries
CREATE POLICY "Ministérios visíveis para igreja" ON public.ministries FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Admin pode gerenciar ministérios" ON public.ministries FOR ALL USING (
  public.is_church_admin(auth.uid(), church_id)
);

-- RLS Policies para Ministry Volunteers, Schedules, etc.
CREATE POLICY "Voluntários visíveis para igreja" ON public.ministry_volunteers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ministries WHERE id = ministry_id AND church_id = public.get_user_church_id(auth.uid()))
);

CREATE POLICY "Admin/Líder pode gerenciar voluntários" ON public.ministry_volunteers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ministries m 
    WHERE m.id = ministry_id 
    AND m.church_id = public.get_user_church_id(auth.uid())
    AND (
      public.is_church_admin(auth.uid(), m.church_id) OR
      public.has_role(auth.uid(), m.church_id, 'lider_ministerio')
    )
  )
);

CREATE POLICY "Escalas visíveis para igreja" ON public.ministry_schedules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ministries WHERE id = ministry_id AND church_id = public.get_user_church_id(auth.uid()))
);

CREATE POLICY "Admin/Líder pode gerenciar escalas" ON public.ministry_schedules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ministries m 
    WHERE m.id = ministry_id 
    AND m.church_id = public.get_user_church_id(auth.uid())
    AND (
      public.is_church_admin(auth.uid(), m.church_id) OR
      public.has_role(auth.uid(), m.church_id, 'lider_ministerio')
    )
  )
);

CREATE POLICY "Voluntários escalados visíveis" ON public.schedule_volunteers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ministry_schedules ms 
    JOIN public.ministries m ON m.id = ms.ministry_id 
    WHERE ms.id = schedule_id AND m.church_id = public.get_user_church_id(auth.uid())
  )
);

CREATE POLICY "Admin/Líder pode escalar voluntários" ON public.schedule_volunteers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ministry_schedules ms 
    JOIN public.ministries m ON m.id = ms.ministry_id 
    WHERE ms.id = schedule_id 
    AND m.church_id = public.get_user_church_id(auth.uid())
    AND (
      public.is_church_admin(auth.uid(), m.church_id) OR
      public.has_role(auth.uid(), m.church_id, 'lider_ministerio')
    )
  )
);

-- RLS Policies para Events
CREATE POLICY "Eventos visíveis para igreja" ON public.events FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Admin/Secretário pode gerenciar eventos" ON public.events FOR ALL USING (
  church_id = public.get_user_church_id(auth.uid()) AND (
    public.is_church_admin(auth.uid(), church_id) OR
    public.has_role(auth.uid(), church_id, 'secretario')
  )
);

CREATE POLICY "Inscrições visíveis para igreja" ON public.event_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND church_id = public.get_user_church_id(auth.uid()))
);

CREATE POLICY "Membros podem se inscrever" ON public.event_registrations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND church_id = public.get_user_church_id(auth.uid()))
);

-- RLS Policies para Courses
CREATE POLICY "Cursos visíveis para igreja" ON public.courses FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid())
);

CREATE POLICY "Admin pode gerenciar cursos" ON public.courses FOR ALL USING (
  public.is_church_admin(auth.uid(), church_id)
);

CREATE POLICY "Alunos visíveis para igreja" ON public.course_students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND church_id = public.get_user_church_id(auth.uid()))
);

CREATE POLICY "Admin pode matricular alunos" ON public.course_students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_id 
    AND public.is_church_admin(auth.uid(), c.church_id)
  )
);

-- RLS Policies para Prayer Requests
CREATE POLICY "Pedidos de oração visíveis" ON public.prayer_requests FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid()) AND (is_public = true OR user_id = auth.uid())
);

CREATE POLICY "Usuários podem criar pedidos" ON public.prayer_requests FOR INSERT WITH CHECK (
  church_id = public.get_user_church_id(auth.uid()) AND user_id = auth.uid()
);

CREATE POLICY "Usuário pode atualizar próprio pedido" ON public.prayer_requests FOR UPDATE USING (
  user_id = auth.uid()
);

-- RLS Policies para Announcements
CREATE POLICY "Avisos visíveis para igreja" ON public.announcements FOR SELECT USING (
  church_id = public.get_user_church_id(auth.uid()) AND is_active = true
);

CREATE POLICY "Admin pode gerenciar avisos" ON public.announcements FOR ALL USING (
  public.is_church_admin(auth.uid(), church_id)
);