-- Add start_date and end_date to network_announcements
ALTER TABLE public.network_announcements 
  ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Add network_id column to courses for network-level courses
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS network_id uuid REFERENCES public.ministries_network(id) DEFAULT NULL;
