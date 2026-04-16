CREATE OR REPLACE FUNCTION public.reset_module_data(p_church_id uuid, p_module text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_pastor boolean;
BEGIN
  -- Verifica se o usuário é pastor da igreja
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND church_id = p_church_id
      AND role = 'pastor'
  ) INTO v_is_pastor;

  IF NOT v_is_pastor THEN
    RETURN json_build_object('success', false, 'error', 'Não autorizado. Apenas o pastor pode resetar dados.');
  END IF;

  CASE p_module
    WHEN 'celulas' THEN
      DELETE FROM public.cell_report_attendance WHERE report_id IN (SELECT id FROM public.cell_reports WHERE church_id = p_church_id);
      DELETE FROM public.cell_reports WHERE church_id = p_church_id;
      DELETE FROM public.cell_leadership_development WHERE church_id = p_church_id;
      DELETE FROM public.cell_pastoral_care WHERE church_id = p_church_id;
      DELETE FROM public.cell_prayer_requests WHERE church_id = p_church_id;
      DELETE FROM public.cell_visitors WHERE church_id = p_church_id;
      DELETE FROM public.cell_members WHERE cell_id IN (SELECT id FROM public.cells WHERE church_id = p_church_id);
      DELETE FROM public.cells WHERE church_id = p_church_id;

    WHEN 'financeiro' THEN
      DELETE FROM public.financial_transactions WHERE church_id = p_church_id;
      DELETE FROM public.financial_categories WHERE church_id = p_church_id;
      DELETE FROM public.financial_campaigns WHERE church_id = p_church_id;
      DELETE FROM public.financial_accounts WHERE church_id = p_church_id;

    WHEN 'eventos' THEN
      DELETE FROM public.event_registrations WHERE event_id IN (SELECT id FROM public.events WHERE church_id = p_church_id);
      DELETE FROM public.events WHERE church_id = p_church_id;

    WHEN 'cursos' THEN
      DELETE FROM public.course_students WHERE course_id IN (SELECT id FROM public.courses WHERE church_id = p_church_id);
      DELETE FROM public.course_lesson_progress WHERE lesson_id IN (SELECT cl.id FROM public.course_lessons cl JOIN public.courses c ON cl.course_id = c.id WHERE c.church_id = p_church_id);
      DELETE FROM public.course_quiz_attempts WHERE quiz_id IN (SELECT cq.id FROM public.course_quizzes cq JOIN public.courses c ON cq.course_id = c.id WHERE c.church_id = p_church_id);
      DELETE FROM public.course_quiz_questions WHERE quiz_id IN (SELECT cq.id FROM public.course_quizzes cq JOIN public.courses c ON cq.course_id = c.id WHERE c.church_id = p_church_id);
      DELETE FROM public.course_quizzes WHERE course_id IN (SELECT id FROM public.courses WHERE church_id = p_church_id);
      DELETE FROM public.course_lessons WHERE course_id IN (SELECT id FROM public.courses WHERE church_id = p_church_id);
      DELETE FROM public.courses WHERE church_id = p_church_id;

    WHEN 'discipulado' THEN
      DELETE FROM public.discipleship_logs WHERE church_id = p_church_id;
      DELETE FROM public.discipleships WHERE church_id = p_church_id;

    WHEN 'consolidacao' THEN
      DELETE FROM public.consolidation_records WHERE church_id = p_church_id;

    WHEN 'ministerios' THEN
      DELETE FROM public.schedule_songs WHERE church_id = p_church_id;
      DELETE FROM public.schedule_volunteers WHERE schedule_id IN (SELECT id FROM public.ministry_schedules WHERE ministry_id IN (SELECT id FROM public.ministries WHERE church_id = p_church_id));
      DELETE FROM public.ministry_schedules WHERE ministry_id IN (SELECT id FROM public.ministries WHERE church_id = p_church_id);
      DELETE FROM public.ministry_role_members WHERE church_id = p_church_id;
      DELETE FROM public.ministry_roles WHERE church_id = p_church_id;
      DELETE FROM public.ministry_volunteers WHERE ministry_id IN (SELECT id FROM public.ministries WHERE church_id = p_church_id);
      DELETE FROM public.ministries WHERE church_id = p_church_id;

    WHEN 'patrimonio' THEN
      DELETE FROM public.church_assets WHERE church_id = p_church_id;

    WHEN 'visitas' THEN
      DELETE FROM public.pastoral_visits WHERE church_id = p_church_id;
      DELETE FROM public.pastoral_counseling WHERE church_id = p_church_id;

    WHEN 'kids' THEN
      DELETE FROM public.kids_studies WHERE church_id = p_church_id;

    WHEN 'convites' THEN
      DELETE FROM public.invitations WHERE church_id = p_church_id;

    WHEN 'membros' THEN
      -- Apaga membros e dados dependentes (mantém células/financeiro vinculados zerados)
      DELETE FROM public.cell_report_attendance WHERE member_id IN (SELECT id FROM public.members WHERE church_id = p_church_id);
      DELETE FROM public.cell_members WHERE member_id IN (SELECT id FROM public.members WHERE church_id = p_church_id);
      DELETE FROM public.cell_visitors WHERE invited_by IN (SELECT id FROM public.members WHERE church_id = p_church_id);
      DELETE FROM public.consolidation_records WHERE church_id = p_church_id;
      DELETE FROM public.discipleships WHERE church_id = p_church_id;
      DELETE FROM public.course_students WHERE member_id IN (SELECT id FROM public.members WHERE church_id = p_church_id);
      DELETE FROM public.event_registrations WHERE member_id IN (SELECT id FROM public.members WHERE church_id = p_church_id);
      DELETE FROM public.ministry_volunteers WHERE member_id IN (SELECT id FROM public.members WHERE church_id = p_church_id);
      DELETE FROM public.ministry_role_members WHERE member_id IN (SELECT id FROM public.members WHERE church_id = p_church_id);
      UPDATE public.cells SET leader_id = NULL, supervisor_id = NULL, vice_leader_1_id = NULL, vice_leader_2_id = NULL WHERE church_id = p_church_id;
      DELETE FROM public.members WHERE church_id = p_church_id;

    ELSE
      RETURN json_build_object('success', false, 'error', 'Módulo desconhecido: ' || p_module);
  END CASE;

  RETURN json_build_object('success', true, 'module', p_module);
END;
$$;