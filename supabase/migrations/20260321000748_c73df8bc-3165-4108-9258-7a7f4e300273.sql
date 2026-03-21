-- Fix missing RLS policies for ministries
CREATE POLICY "Church members can read ministries"
  ON public.ministries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.church_id = ministries.church_id
    )
  );

CREATE POLICY "Admin can manage ministries"
  ON public.ministries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.church_id = ministries.church_id AND ur.role = 'pastor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.church_id = ministries.church_id AND ur.role = 'pastor'
    )
  );

-- Fix missing RLS policies for ministry_volunteers
CREATE POLICY "Church members can read ministry_volunteers"
  ON public.ministry_volunteers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministries m
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE m.id = ministry_volunteers.ministry_id AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage ministry_volunteers"
  ON public.ministry_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministries m
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE m.id = ministry_volunteers.ministry_id AND ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ministries m
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE m.id = ministry_volunteers.ministry_id AND ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
  );

-- Fix missing RLS policies for ministry_schedules
CREATE POLICY "Church members can read ministry_schedules"
  ON public.ministry_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministries m
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE m.id = ministry_schedules.ministry_id AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage ministry_schedules"
  ON public.ministry_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministries m
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE m.id = ministry_schedules.ministry_id AND ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ministries m
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE m.id = ministry_schedules.ministry_id AND ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
  );

-- Fix missing RLS policies for schedule_volunteers
CREATE POLICY "Church members can read schedule_volunteers"
  ON public.schedule_volunteers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministry_schedules ms
      JOIN public.ministries m ON m.id = ms.ministry_id
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE ms.id = schedule_volunteers.schedule_id AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage schedule_volunteers"
  ON public.schedule_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ministry_schedules ms
      JOIN public.ministries m ON m.id = ms.ministry_id
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE ms.id = schedule_volunteers.schedule_id AND ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ministry_schedules ms
      JOIN public.ministries m ON m.id = ms.ministry_id
      JOIN public.user_roles ur ON ur.church_id = m.church_id
      WHERE ms.id = schedule_volunteers.schedule_id AND ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
  );

-- Allow volunteers to confirm their own schedule
CREATE POLICY "Volunteers can update own schedule"
  ON public.schedule_volunteers FOR UPDATE
  TO authenticated
  USING (
    member_id IN (
      SELECT m.id FROM public.members m
      JOIN public.profiles p ON (p.member_id = m.id OR lower(p.email) = lower(m.email))
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT m.id FROM public.members m
      JOIN public.profiles p ON (p.member_id = m.id OR lower(p.email) = lower(m.email))
      WHERE p.user_id = auth.uid()
    )
  );