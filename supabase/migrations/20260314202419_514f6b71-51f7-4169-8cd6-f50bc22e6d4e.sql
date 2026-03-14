
-- Add network roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'network_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'network_finance';

-- Create cascade delete function for churches
CREATE OR REPLACE FUNCTION public.delete_church_cascade(p_church_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is super_admin
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('success', false, 'error', 'not_authorized');
  END IF;

  -- Delete in dependency order (children first)
  DELETE FROM public.cell_report_attendance WHERE report_id IN (SELECT id FROM public.cell_reports WHERE church_id = p_church_id);
  DELETE FROM public.cell_reports WHERE church_id = p_church_id;
  DELETE FROM public.cell_leadership_development WHERE church_id = p_church_id;
  DELETE FROM public.cell_pastoral_care WHERE church_id = p_church_id;
  DELETE FROM public.cell_prayer_requests WHERE church_id = p_church_id;
  DELETE FROM public.cell_visitors WHERE church_id = p_church_id;
  DELETE FROM public.cell_members WHERE cell_id IN (SELECT id FROM public.cells WHERE church_id = p_church_id);
  DELETE FROM public.cells WHERE church_id = p_church_id;

  DELETE FROM public.schedule_songs WHERE church_id = p_church_id;
  DELETE FROM public.schedule_volunteers WHERE schedule_id IN (SELECT id FROM public.ministry_schedules WHERE ministry_id IN (SELECT id FROM public.ministries WHERE church_id = p_church_id));
  DELETE FROM public.ministry_schedules WHERE ministry_id IN (SELECT id FROM public.ministries WHERE church_id = p_church_id);
  DELETE FROM public.ministry_role_members WHERE church_id = p_church_id;
  DELETE FROM public.ministry_roles WHERE church_id = p_church_id;
  DELETE FROM public.ministry_volunteers WHERE ministry_id IN (SELECT id FROM public.ministries WHERE church_id = p_church_id);
  DELETE FROM public.ministries WHERE church_id = p_church_id;

  DELETE FROM public.financial_transactions WHERE church_id = p_church_id;
  DELETE FROM public.financial_categories WHERE church_id = p_church_id;
  DELETE FROM public.financial_campaigns WHERE church_id = p_church_id;
  DELETE FROM public.financial_accounts WHERE church_id = p_church_id;

  DELETE FROM public.course_students WHERE course_id IN (SELECT id FROM public.courses WHERE church_id = p_church_id);
  DELETE FROM public.course_lesson_progress WHERE lesson_id IN (SELECT cl.id FROM public.course_lessons cl JOIN public.courses c ON cl.course_id = c.id WHERE c.church_id = p_church_id);
  DELETE FROM public.course_quiz_attempts WHERE quiz_id IN (SELECT cq.id FROM public.course_quizzes cq JOIN public.courses c ON cq.course_id = c.id WHERE c.church_id = p_church_id);
  DELETE FROM public.course_quiz_questions WHERE quiz_id IN (SELECT cq.id FROM public.course_quizzes cq JOIN public.courses c ON cq.course_id = c.id WHERE c.church_id = p_church_id);
  DELETE FROM public.course_quizzes WHERE course_id IN (SELECT id FROM public.courses WHERE church_id = p_church_id);
  DELETE FROM public.course_lessons WHERE course_id IN (SELECT id FROM public.courses WHERE church_id = p_church_id);
  DELETE FROM public.courses WHERE church_id = p_church_id;

  DELETE FROM public.event_registrations WHERE event_id IN (SELECT id FROM public.events WHERE church_id = p_church_id);
  DELETE FROM public.events WHERE church_id = p_church_id;

  DELETE FROM public.consolidation_records WHERE church_id = p_church_id;
  DELETE FROM public.discipleships WHERE church_id = p_church_id;
  DELETE FROM public.pastoral_counseling WHERE church_id = p_church_id;
  DELETE FROM public.pastoral_visits WHERE church_id = p_church_id;
  DELETE FROM public.kids_studies WHERE church_id = p_church_id;
  DELETE FROM public.prayer_requests WHERE church_id = p_church_id;
  DELETE FROM public.member_alerts WHERE church_id = p_church_id;
  DELETE FROM public.announcements WHERE church_id = p_church_id;
  DELETE FROM public.reminders WHERE church_id = p_church_id;
  DELETE FROM public.push_subscriptions WHERE church_id = p_church_id;
  DELETE FROM public.church_assets WHERE church_id = p_church_id;

  DELETE FROM public.ai_chat_history WHERE church_id = p_church_id;
  DELETE FROM public.ai_dashboard_reports WHERE church_id = p_church_id;
  DELETE FROM public.ai_error_logs WHERE church_id = p_church_id;
  DELETE FROM public.ai_member_alerts WHERE church_id = p_church_id;
  DELETE FROM public.ai_usage_control WHERE church_id = p_church_id;
  DELETE FROM public.church_features WHERE church_id = p_church_id;
  DELETE FROM public.church_settings WHERE church_id = p_church_id;

  DELETE FROM public.invitations WHERE church_id = p_church_id;
  DELETE FROM public.user_roles WHERE church_id = p_church_id;
  DELETE FROM public.members WHERE church_id = p_church_id;
  DELETE FROM public.congregations WHERE church_id = p_church_id;

  -- Unlink profiles (don't delete user accounts)
  UPDATE public.profiles SET church_id = NULL, member_id = NULL, congregation_id = NULL WHERE church_id = p_church_id;

  -- Finally delete the church
  DELETE FROM public.churches WHERE id = p_church_id;

  RETURN json_build_object('success', true);
END;
$$;
