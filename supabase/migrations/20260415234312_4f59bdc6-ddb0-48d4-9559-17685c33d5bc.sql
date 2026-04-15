ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS email text;

DROP POLICY IF EXISTS "Pastors can read own church subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can create own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service can update subscriptions" ON public.subscriptions;

CREATE POLICY "Church users can read subscription status"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.church_id = subscriptions.church_id
  )
);