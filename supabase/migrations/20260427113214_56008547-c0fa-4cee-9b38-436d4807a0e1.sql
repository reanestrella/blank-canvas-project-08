
-- 1. Add trial fields
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at
  ON public.subscriptions(trial_ends_at)
  WHERE trial = true;

-- 2. Backfill trial for churches without subscription
INSERT INTO public.subscriptions (church_id, user_id, plan, status, trial, trial_ends_at)
SELECT
  c.id,
  COALESCE(
    (SELECT ur.user_id FROM public.user_roles ur
      WHERE ur.church_id = c.id AND ur.role = 'pastor' LIMIT 1),
    (SELECT ur.user_id FROM public.user_roles ur
      WHERE ur.church_id = c.id LIMIT 1)
  ) AS user_id,
  'trial',
  'trial',
  true,
  now() + interval '3 days'
FROM public.churches c
LEFT JOIN public.subscriptions s ON s.church_id = c.id
WHERE s.id IS NULL
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.church_id = c.id)
ON CONFLICT (church_id) DO NOTHING;

-- 3. Function to mark expired trials
CREATE OR REPLACE FUNCTION public.mark_expired_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = now()
  WHERE trial = true
    AND status = 'trial'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_expired_trials() TO authenticated;

-- 4. Update setup_new_church to create trial automatically
CREATE OR REPLACE FUNCTION public.setup_new_church(_church_name text, _email text, _full_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare
  v_user_id uuid;
  v_church_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(_email)
  limit 1;

  if v_user_id is null then
    return json_build_object('success', false, 'error', 'user not found');
  end if;

  insert into public.churches (name)
  values (_church_name)
  returning id into v_church_id;

  insert into public.profiles (user_id, church_id, full_name, email)
  values (v_user_id, v_church_id, _full_name, _email)
  on conflict (user_id)
  do update set church_id = excluded.church_id, full_name = excluded.full_name;

  insert into public.user_roles (user_id, church_id, role)
  values (v_user_id, v_church_id, 'pastor')
  on conflict (user_id, church_id, role) do nothing;

  -- Create automatic trial subscription (3 days)
  insert into public.subscriptions (church_id, user_id, plan, status, trial, trial_ends_at)
  values (v_church_id, v_user_id, 'trial', 'trial', true, now() + interval '3 days')
  on conflict (church_id) do nothing;

  return json_build_object('success', true, 'church_id', v_church_id);
end;
$$;
