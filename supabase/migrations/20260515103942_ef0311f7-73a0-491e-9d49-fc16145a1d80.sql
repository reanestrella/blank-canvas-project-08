
-- Lote 2: Consolidadores múltiplos
CREATE TABLE IF NOT EXISTS public.consolidation_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consolidation_id uuid NOT NULL REFERENCES public.consolidation_records(id) ON DELETE CASCADE,
  consolidator_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (consolidation_id, consolidator_member_id)
);

CREATE INDEX IF NOT EXISTS idx_cons_assignees_record ON public.consolidation_assignees(consolidation_id);
CREATE INDEX IF NOT EXISTS idx_cons_assignees_consolidator ON public.consolidation_assignees(consolidator_member_id);
CREATE INDEX IF NOT EXISTS idx_cons_assignees_church ON public.consolidation_assignees(church_id);

ALTER TABLE public.consolidation_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members of church can read assignees"
  ON public.consolidation_assignees FOR SELECT
  USING (public.user_belongs_to_church(church_id));

CREATE POLICY "Church admins can manage assignees"
  ON public.consolidation_assignees FOR ALL
  USING (public.user_is_church_admin(church_id))
  WITH CHECK (public.user_is_church_admin(church_id));

-- Backfill a partir do consolidator_id legado
INSERT INTO public.consolidation_assignees (consolidation_id, consolidator_member_id, church_id, assigned_at)
SELECT cr.id, cr.consolidator_id, cr.church_id, cr.created_at
FROM public.consolidation_records cr
WHERE cr.consolidator_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Atualizar safe_delete_member para limpar nova tabela
CREATE OR REPLACE FUNCTION public.safe_delete_member(p_member_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_church_id uuid;
  v_summary jsonb := '{}'::jsonb;
  v_count int;
BEGIN
  SELECT church_id INTO v_church_id FROM public.members WHERE id = p_member_id;
  IF v_church_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'member_not_found');
  END IF;
  IF NOT public.user_is_church_admin(v_church_id) THEN
    RETURN json_build_object('success', false, 'error', 'not_authorized');
  END IF;

  UPDATE public.profiles SET member_id = NULL WHERE member_id = p_member_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_summary := v_summary || jsonb_build_object('profiles_unlinked', v_count);

  UPDATE public.cells SET leader_id = NULL WHERE leader_id = p_member_id;
  UPDATE public.cells SET supervisor_id = NULL WHERE supervisor_id = p_member_id;
  UPDATE public.cells SET vice_leader_1_id = NULL WHERE vice_leader_1_id = p_member_id;
  UPDATE public.cells SET vice_leader_2_id = NULL WHERE vice_leader_2_id = p_member_id;

  UPDATE public.cell_visitors SET invited_by = NULL WHERE invited_by = p_member_id;
  DELETE FROM public.cell_report_attendance WHERE member_id = p_member_id;
  DELETE FROM public.cell_members WHERE member_id = p_member_id;
  DELETE FROM public.cell_prayer_requests WHERE member_id = p_member_id;
  DELETE FROM public.cell_pastoral_care WHERE member_id = p_member_id;
  DELETE FROM public.cell_leadership_development WHERE member_id = p_member_id;

  DELETE FROM public.consolidation_assignees WHERE consolidator_member_id = p_member_id;
  DELETE FROM public.consolidation_records WHERE member_id = p_member_id OR consolidator_id = p_member_id;

  DELETE FROM public.discipleships WHERE disciple_id = p_member_id OR discipler_id = p_member_id;

  UPDATE public.financial_transactions SET member_id = NULL WHERE member_id = p_member_id;

  UPDATE public.ministries SET leader_id = NULL WHERE leader_id = p_member_id;
  DELETE FROM public.ministry_volunteers WHERE member_id = p_member_id;
  DELETE FROM public.ministry_role_members WHERE member_id = p_member_id;
  DELETE FROM public.schedule_volunteers WHERE member_id = p_member_id;
  DELETE FROM public.event_registrations WHERE member_id = p_member_id;
  UPDATE public.courses SET teacher_id = NULL WHERE teacher_id = p_member_id;
  DELETE FROM public.course_students WHERE member_id = p_member_id;

  DELETE FROM public.pastoral_visits WHERE member_id = p_member_id OR visitor_id = p_member_id;
  DELETE FROM public.pastoral_counseling WHERE member_id = p_member_id OR counselor_id = p_member_id;
  DELETE FROM public.pastoral_notes WHERE member_id = p_member_id;
  DELETE FROM public.pastoral_appointments WHERE member_id = p_member_id OR responsible_id = p_member_id;

  DELETE FROM public.reminders WHERE member_id = p_member_id;
  DELETE FROM public.spiritual_history WHERE member_id = p_member_id;
  DELETE FROM public.member_alerts WHERE member_id = p_member_id;
  DELETE FROM public.ai_member_alerts WHERE member_id = p_member_id;
  UPDATE public.worship_sets SET created_by_member_id = NULL WHERE created_by_member_id = p_member_id;
  UPDATE public.kids_studies SET created_by_member_id = NULL WHERE created_by_member_id = p_member_id;
  UPDATE public.invitations SET member_id = NULL WHERE member_id = p_member_id;
  UPDATE public.pending_users SET linked_member_id = NULL WHERE linked_member_id = p_member_id;

  DELETE FROM public.members WHERE id = p_member_id;

  RETURN json_build_object('success', true, 'summary', v_summary);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;
