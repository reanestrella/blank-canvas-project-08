-- Add network roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'network_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'network_finance';