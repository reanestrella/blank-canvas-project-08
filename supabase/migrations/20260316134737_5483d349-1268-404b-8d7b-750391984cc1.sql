CREATE TABLE IF NOT EXISTS public.app_module_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(church_id, module_key)
);

ALTER TABLE public.app_module_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own church module configs"
  ON public.app_module_configs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = app_module_configs.church_id));

CREATE POLICY "Admins can manage own church module configs"
  ON public.app_module_configs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = app_module_configs.church_id AND ur.role = 'pastor'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = app_module_configs.church_id AND ur.role = 'pastor'));

CREATE TABLE IF NOT EXISTS public.network_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES public.ministries_network(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.network_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network users can read announcements"
  ON public.network_announcements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM churches c 
    JOIN user_roles ur ON ur.church_id = c.id 
    WHERE ur.user_id = auth.uid() AND c.ministry_network_id = network_announcements.network_id
  ));

CREATE POLICY "Network admins can manage announcements"
  ON public.network_announcements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur JOIN profiles p ON p.user_id = ur.user_id WHERE ur.user_id = auth.uid() AND ur.role = 'network_admin' AND p.ministry_network_id = network_announcements.network_id))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur JOIN profiles p ON p.user_id = ur.user_id WHERE ur.user_id = auth.uid() AND ur.role = 'network_admin' AND p.ministry_network_id = network_announcements.network_id));