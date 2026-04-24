import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.https://ycaiusoyqoeccmmixgrf.supabase.co/rest/v1/!,
  import.meta.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYWl1c295cW9lY2NtbWl4Z3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzIzMTgsImV4cCI6MjA4NzE0ODMxOH0.uj4lXNqc88XP8drTvxlwhswxK18sJtRRoVs8JIRTEvI,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
