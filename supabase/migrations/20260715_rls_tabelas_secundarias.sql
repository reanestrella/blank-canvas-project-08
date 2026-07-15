-- Migration aplicada manualmente via SQL Editor em 15/07/2026
-- NÃO executar via CLI — registro histórico apenas
-- Ativa RLS nas 16 tabelas de módulos secundários (worship_*, course_*, ministry_roles, ministry_role_members, kids_studies, church_assets, sermon_outlines, church_settings, pastoral_notes, schedule_songs)

BEGIN;

-- ================= GRUPO A: tabelas com church_id =================
ALTER TABLE public.worship_songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS worship_songs_tenant_all ON public.worship_songs;
CREATE POLICY worship_songs_tenant_all ON public.worship_songs
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.worship_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS worship_sets_tenant_all ON public.worship_sets;
CREATE POLICY worship_sets_tenant_all ON public.worship_sets
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.worship_set_songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS worship_set_songs_tenant_all ON public.worship_set_songs;
CREATE POLICY worship_set_songs_tenant_all ON public.worship_set_songs
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.schedule_songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schedule_songs_tenant_all ON public.schedule_songs;
CREATE POLICY schedule_songs_tenant_all ON public.schedule_songs
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.ministry_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ministry_roles_tenant_all ON public.ministry_roles;
CREATE POLICY ministry_roles_tenant_all ON public.ministry_roles
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.ministry_role_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ministry_role_members_tenant_all ON public.ministry_role_members;
CREATE POLICY ministry_role_members_tenant_all ON public.ministry_role_members
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.kids_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kids_studies_tenant_all ON public.kids_studies;
CREATE POLICY kids_studies_tenant_all ON public.kids_studies
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.church_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS church_assets_tenant_all ON public.church_assets;
CREATE POLICY church_assets_tenant_all ON public.church_assets
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.sermon_outlines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sermon_outlines_tenant_all ON public.sermon_outlines;
CREATE POLICY sermon_outlines_tenant_all ON public.sermon_outlines
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS church_settings_tenant_all ON public.church_settings;
CREATE POLICY church_settings_tenant_all ON public.church_settings
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

ALTER TABLE public.pastoral_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pastoral_notes_tenant_all ON public.pastoral_notes;
CREATE POLICY pastoral_notes_tenant_all ON public.pastoral_notes
  FOR ALL TO authenticated
  USING (public.user_belongs_to_church(church_id) OR public.is_super_admin())
  WITH CHECK (public.user_belongs_to_church(church_id) OR public.is_super_admin());

-- ============ GRUPO B: course_* sem church_id (via JOIN) ============
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_lessons_tenant_all ON public.course_lessons;
CREATE POLICY course_lessons_tenant_all ON public.course_lessons
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_lessons.course_id AND public.user_belongs_to_church(c.church_id)))
  WITH CHECK (public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_lessons.course_id AND public.user_belongs_to_church(c.church_id)));

ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_quizzes_tenant_all ON public.course_quizzes;
CREATE POLICY course_quizzes_tenant_all ON public.course_quizzes
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_quizzes.course_id AND public.user_belongs_to_church(c.church_id)))
  WITH CHECK (public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_quizzes.course_id AND public.user_belongs_to_church(c.church_id)));

ALTER TABLE public.course_quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_quiz_questions_tenant_all ON public.course_quiz_questions;
CREATE POLICY course_quiz_questions_tenant_all ON public.course_quiz_questions
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.course_quizzes q
    JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = course_quiz_questions.quiz_id AND public.user_belongs_to_church(c.church_id)))
  WITH CHECK (public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.course_quizzes q
    JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = course_quiz_questions.quiz_id AND public.user_belongs_to_church(c.church_id)));

-- ======= GRUPO C: progresso/tentativa do aluno (por user_id) =======
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_lesson_progress_select ON public.course_lesson_progress;
CREATE POLICY course_lesson_progress_select ON public.course_lesson_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.course_lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = course_lesson_progress.lesson_id AND public.user_belongs_to_church(c.church_id)));
DROP POLICY IF EXISTS course_lesson_progress_write ON public.course_lesson_progress;
CREATE POLICY course_lesson_progress_write ON public.course_lesson_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

ALTER TABLE public.course_quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_quiz_attempts_select ON public.course_quiz_attempts;
CREATE POLICY course_quiz_attempts_select ON public.course_quiz_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.course_quizzes q
    JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = course_quiz_attempts.quiz_id AND public.user_belongs_to_church(c.church_id)));
DROP POLICY IF EXISTS course_quiz_attempts_write ON public.course_quiz_attempts;
CREATE POLICY course_quiz_attempts_write ON public.course_quiz_attempts
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

COMMIT;
