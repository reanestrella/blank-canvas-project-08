
-- Add unique constraint for upsert on cell_report_attendance
ALTER TABLE public.cell_report_attendance
  ADD CONSTRAINT cell_report_attendance_report_member_unique
  UNIQUE (report_id, member_id);
