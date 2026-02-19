-- Create invitations table for admin-generated invite links
CREATE TABLE public.invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.app_role NOT NULL,
    token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    invited_by UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view invitations for their church
CREATE POLICY "Admins can view church invitations"
ON public.invitations
FOR SELECT
USING (
    church_id IN (
        SELECT ur.church_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
);

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (
    church_id IN (
        SELECT ur.church_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
);

-- Allow public read for token validation during registration
CREATE POLICY "Anyone can read invitation by token"
ON public.invitations
FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- Only admins can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.invitations
FOR DELETE
USING (
    church_id IN (
        SELECT ur.church_id FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'pastor'
    )
);

-- Add constraint to ensure token is unique and valid
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_church_id ON public.invitations(church_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);