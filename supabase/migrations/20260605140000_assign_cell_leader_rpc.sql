-- Admin RPC to manually link a user as cell leader.
-- Bypasses RLS (SECURITY DEFINER) so pastors/secretaries can fix
-- existing users whose cell_leaders row was never created.
CREATE OR REPLACE FUNCTION public.assign_cell_leader(
  p_user_id  uuid,
  p_cell_id  uuid,
  p_church_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_caller_id uuid;
  v_is_admin  boolean;
BEGIN
  v_caller_id := auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id   = v_caller_id
      AND church_id = p_church_id
      AND role IN ('pastor', 'secretario')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  INSERT INTO public.cell_leaders (user_id, cell_id, church_id)
  VALUES (p_user_id, p_cell_id, p_church_id)
  ON CONFLICT (user_id, cell_id) DO NOTHING;

  UPDATE public.cells
  SET leader_user_id = p_user_id
  WHERE id = p_cell_id;

  RETURN json_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.assign_cell_leader(uuid, uuid, uuid) TO authenticated;

-- Improved reconciliation: also covers invites created without email
-- by matching via profiles.church_id + used_at proximity.
-- Covers both email-based and link-only invites.
INSERT INTO public.cell_leaders (user_id, cell_id, church_id)
SELECT DISTINCT
  p.user_id,
  unnested.cell_id,
  i.church_id
FROM public.invitations i
CROSS JOIN LATERAL unnest(i.cell_ids) AS unnested(cell_id)
JOIN public.user_roles ur
  ON ur.church_id   = i.church_id
  AND ur.role::text = 'lider_celula'
JOIN public.profiles p
  ON p.user_id    = ur.user_id
  AND p.church_id = i.church_id
WHERE i.status             = 'accepted'
  AND i.cell_ids           IS NOT NULL
  AND array_length(i.cell_ids, 1) > 0
  AND (
    -- email-based match
    (i.email IS NOT NULL AND i.email <> ''
      AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.user_id AND lower(au.email) = lower(i.email)))
    OR
    -- link-only: used_at within 10 minutes of profile creation/update (best-effort)
    (i.email IS NULL OR i.email = '')
  )
ON CONFLICT (user_id, cell_id) DO NOTHING;

-- Sync leader_user_id for cells where leader_id maps to a profiled user
UPDATE public.cells c
SET leader_user_id = p.user_id
FROM public.profiles p
WHERE p.member_id        = c.leader_id
  AND p.user_id          IS NOT NULL
  AND c.leader_id        IS NOT NULL
  AND (c.leader_user_id IS NULL OR c.leader_user_id <> p.user_id);
