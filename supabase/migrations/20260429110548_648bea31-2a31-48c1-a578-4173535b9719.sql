
CREATE OR REPLACE FUNCTION public.user_belongs_to_church(_church_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND church_id = _church_id);
$$;

CREATE OR REPLACE FUNCTION public.user_is_church_admin(_church_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND church_id = _church_id
      AND role IN ('pastor','secretario','tesoureiro')
  );
$$;

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (church_id IS NOT NULL AND public.user_belongs_to_church(church_id)));
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_manage ON public.user_roles;
DROP POLICY IF EXISTS user_roles_self_insert ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.user_is_church_admin(church_id));
CREATE POLICY user_roles_self_insert ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.user_is_church_admin(church_id));
CREATE POLICY user_roles_admin_manage ON public.user_roles FOR ALL TO authenticated
  USING (public.user_is_church_admin(church_id))
  WITH CHECK (public.user_is_church_admin(church_id));

-- churches
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS churches_select ON public.churches;
DROP POLICY IF EXISTS churches_admin_update ON public.churches;
DROP POLICY IF EXISTS churches_insert_authenticated ON public.churches;
DROP POLICY IF EXISTS churches_select_anon_basic ON public.churches;
CREATE POLICY churches_select ON public.churches FOR SELECT TO authenticated
  USING (public.user_belongs_to_church(id) OR public.is_super_admin());
CREATE POLICY churches_insert_authenticated ON public.churches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY churches_admin_update ON public.churches FOR UPDATE TO authenticated
  USING (public.user_is_church_admin(id) OR public.is_super_admin())
  WITH CHECK (public.user_is_church_admin(id) OR public.is_super_admin());
CREATE POLICY churches_select_anon_basic ON public.churches FOR SELECT TO anon
  USING (is_active = true);

-- Generic tenant tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'members','cells','events','congregations','church_settings',
    'financial_transactions','financial_accounts','financial_campaigns','financial_categories',
    'consolidation_records','discipleships','ministries',
    'cell_reports','cell_visitors','member_alerts'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_select ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_insert ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_update ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_delete ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY %I_tenant_select ON public.%I FOR SELECT TO authenticated USING (public.user_belongs_to_church(church_id));', t, t);
    EXECUTE format('CREATE POLICY %I_tenant_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.user_belongs_to_church(church_id));', t, t);
    EXECUTE format('CREATE POLICY %I_tenant_update ON public.%I FOR UPDATE TO authenticated USING (public.user_belongs_to_church(church_id)) WITH CHECK (public.user_belongs_to_church(church_id));', t, t);
    EXECUTE format('CREATE POLICY %I_tenant_delete ON public.%I FOR DELETE TO authenticated USING (public.user_is_church_admin(church_id));', t, t);
  END LOOP;
END $$;

-- cell_members (scoped via cells)
ALTER TABLE public.cell_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cell_members_tenant_all ON public.cell_members;
CREATE POLICY cell_members_tenant_all ON public.cell_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cells c WHERE c.id = cell_members.cell_id AND public.user_belongs_to_church(c.church_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cells c WHERE c.id = cell_members.cell_id AND public.user_belongs_to_church(c.church_id)));

-- cell_report_attendance (scoped via cell_reports)
ALTER TABLE public.cell_report_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cell_report_attendance_tenant_all ON public.cell_report_attendance;
CREATE POLICY cell_report_attendance_tenant_all ON public.cell_report_attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cell_reports r WHERE r.id = cell_report_attendance.report_id AND public.user_belongs_to_church(r.church_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cell_reports r WHERE r.id = cell_report_attendance.report_id AND public.user_belongs_to_church(r.church_id)));
