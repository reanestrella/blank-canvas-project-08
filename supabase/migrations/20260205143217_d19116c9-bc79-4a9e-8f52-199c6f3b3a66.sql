-- Fix RLS policy for invitations to allow anonymous access by token
-- First drop the existing policy that only allows authenticated access
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.invitations;

-- Create new policy that allows unauthenticated access to valid invitations by token
CREATE POLICY "Public can read valid invitation by token" 
ON public.invitations 
FOR SELECT 
TO anon, authenticated
USING (
  used_at IS NULL 
  AND expires_at > now()
);

-- Also allow anon to update (mark as used) when completing registration
DROP POLICY IF EXISTS "Anyone can mark invitation as used" ON public.invitations;

CREATE POLICY "Public can mark invitation as used" 
ON public.invitations 
FOR UPDATE 
TO anon, authenticated
USING (
  used_at IS NULL 
  AND expires_at > now()
)
WITH CHECK (
  used_at IS NOT NULL
);