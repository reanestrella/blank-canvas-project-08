
CREATE OR REPLACE FUNCTION public.safe_delete_member(p_member_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- 1) Profiles: desvincular (mantém usuário do app)
  UPDATE public.profiles SET member_id = NULL WHERE member_id = p_member_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_summary := v_summary || jsonb_build_object('profiles_unlinked', v_count);

  -- 2) Cells: limpar leader, supervisor e vice-líderes
  UPDATE public.cells SET leader_id = NULL WHERE leader_id = p_member_id;
  UPDATE public.cells SET supervisor_id = NULL WHERE supervisor_id = p_member_id;
  UPDATE public.cells SET vice_leader_1_id = NULL WHERE vice_leader_1_id = p_member_id;
  UPDATE public.cells SET vice_leader_2_id = NULL WHERE vice_leader_2_id = p_member_id;

  -- 3) Cell visitors / attendance / membership
  UPDATE public.cell_visitors SET invited_by = NULL WHERE invited_by = p_member_id;
  DELETE FROM public.cell_report_attendance WHERE member_id = p_member_id;
  DELETE FROM public.cell_members WHERE member_id = p_member_id;
  DELETE FROM public.cell_prayer_requests WHERE member_id = p_member_id;
  DELETE FROM public.cell_pastoral_care WHERE member_id = p_member_id;
  DELETE FROM public.cell_leadership_development WHERE member_id = p_member_id;

  -- 4) Consolidação (como pessoa OU como consolidador)
  DELETE FROM public.consolidation_records
   WHERE member_id = p_member_id OR consolidator_id = p_member_id;

  -- 5) Discipulado (como discípulo ou discipulador)
  DELETE FROM public.discipleships
   WHERE disciple_id = p_member_id OR discipler_id = p_member_id;

  -- 6) Financeiro: preservar histórico, apenas desvincular
  UPDATE public.financial_transactions SET member_id = NULL WHERE member_id = p_member_id;

  -- 7) Ministérios / escalas / eventos / cursos
  UPDATE public.ministries SET leader_id = NULL WHERE leader_id = p_member_id;
  DELETE FROM public.ministry_volunteers WHERE member_id = p_member_id;
  DELETE FROM public.ministry_role_members WHERE member_id = p_member_id;
  DELETE FROM public.schedule_volunteers WHERE member_id = p_member_id;
  DELETE FROM public.event_registrations WHERE member_id = p_member_id;
  UPDATE public.courses SET teacher_id = NULL WHERE teacher_id = p_member_id;
  DELETE FROM public.course_students WHERE member_id = p_member_id;

  -- 8) Pastoral
  DELETE FROM public.pastoral_visits WHERE member_id = p_member_id OR visitor_id = p_member_id;
  DELETE FROM public.pastoral_counseling WHERE member_id = p_member_id OR counselor_id = p_member_id;
  DELETE FROM public.pastoral_notes WHERE member_id = p_member_id;
  DELETE FROM public.pastoral_appointments WHERE member_id = p_member_id OR responsible_id = p_member_id;

  -- 9) Outros
  DELETE FROM public.reminders WHERE member_id = p_member_id;
  DELETE FROM public.spiritual_history WHERE member_id = p_member_id;
  DELETE FROM public.member_alerts WHERE member_id = p_member_id;
  DELETE FROM public.ai_member_alerts WHERE member_id = p_member_id;
  UPDATE public.worship_sets SET created_by_member_id = NULL WHERE created_by_member_id = p_member_id;
  UPDATE public.kids_studies SET created_by_member_id = NULL WHERE created_by_member_id = p_member_id;
  UPDATE public.invitations SET member_id = NULL WHERE member_id = p_member_id;
  UPDATE public.pending_users SET linked_member_id = NULL WHERE linked_member_id = p_member_id;

  -- 10) Finalmente, exclui o membro
  DELETE FROM public.members WHERE id = p_member_id;

  RETURN json_build_object('success', true, 'summary', v_summary);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.safe_delete_member(uuid) TO authenticated;
