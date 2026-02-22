
-- =============================================
-- AI MEMBER ALERTS (Detector de membros afastados)
-- =============================================
CREATE TABLE public.ai_member_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  member_id uuid NOT NULL REFERENCES public.members(id),
  risk_level text NOT NULL DEFAULT 'baixo',
  message text,
  last_attendance_date date,
  days_absent integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false
);

ALTER TABLE public.ai_member_alerts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AI CHAT HISTORY (Assistente do Líder)
-- =============================================
CREATE TABLE public.ai_chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  user_id uuid NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AI USAGE CONTROL (Controle de consumo)
-- =============================================
CREATE TABLE public.ai_usage_control (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  user_id uuid NOT NULL,
  executions_today integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(church_id, user_id)
);

ALTER TABLE public.ai_usage_control ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CHURCH FEATURES (Controle premium por igreja)
-- =============================================
CREATE TABLE public.church_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id) UNIQUE,
  ai_enabled boolean NOT NULL DEFAULT false
);

ALTER TABLE public.church_features ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER FEATURES (Controle premium por usuário)
-- =============================================
CREATE TABLE public.user_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  ai_enabled boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, church_id)
);

ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ADD ai_report field to cell_reports
-- =============================================
ALTER TABLE public.cell_reports ADD COLUMN IF NOT EXISTS ai_report text;

-- =============================================
-- PUSH NOTIFICATION SUBSCRIPTIONS (structure)
-- =============================================
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  church_id uuid NOT NULL REFERENCES public.churches(id),
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
