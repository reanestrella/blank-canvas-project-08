
CREATE TABLE public.pastoral_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  appointment_date date NOT NULL DEFAULT CURRENT_DATE,
  appointment_time text,
  end_time text,
  appointment_type text NOT NULL DEFAULT 'reuniao',
  status text NOT NULL DEFAULT 'agendado',
  responsible_id uuid REFERENCES public.members(id),
  member_id uuid REFERENCES public.members(id),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pastoral_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own church appointments"
ON public.pastoral_appointments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.church_id = pastoral_appointments.church_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.church_id = pastoral_appointments.church_id
  )
);
