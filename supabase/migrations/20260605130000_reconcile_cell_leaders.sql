-- Reconcile cell_leaders for users who accepted invitations that had cell_ids,
-- but whose cell_leaders rows were never created (due to the p_user_id RPC bug).
-- Matches by email: invitation.email → auth.users.email → user_roles (lider_celula).
INSERT INTO public.cell_leaders (user_id, cell_id, church_id)
SELECT DISTINCT
  au.id        AS user_id,
  unnested.cell_id,
  i.church_id
FROM public.invitations i
CROSS JOIN LATERAL unnest(i.cell_ids) AS unnested(cell_id)
JOIN auth.users au
  ON lower(au.email) = lower(i.email)
JOIN public.user_roles ur
  ON ur.user_id   = au.id
  AND ur.church_id = i.church_id
  AND ur.role::text = 'lider_celula'
WHERE i.status        = 'accepted'
  AND i.cell_ids      IS NOT NULL
  AND array_length(i.cell_ids, 1) > 0
  AND i.email         IS NOT NULL
  AND i.email         <> ''
ON CONFLICT (user_id, cell_id) DO NOTHING;

-- Also sync leader_user_id on cells where leader_id (member) maps to a known user,
-- so the leader_user_id fallback in useCells works correctly.
UPDATE public.cells c
SET leader_user_id = p.user_id
FROM public.profiles p
WHERE p.member_id  = c.leader_id
  AND p.user_id    IS NOT NULL
  AND c.leader_id  IS NOT NULL
  AND (c.leader_user_id IS NULL OR c.leader_user_id <> p.user_id);
