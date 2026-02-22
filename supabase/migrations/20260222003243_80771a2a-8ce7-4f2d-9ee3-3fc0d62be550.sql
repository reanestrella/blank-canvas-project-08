-- Fix assign_user_role trigger: replace invalid enum values 'admin' and 'member' with 'pastor' and 'membro'
CREATE OR REPLACE FUNCTION public.assign_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_count integer;
begin
  select count(*)
  into user_count
  from public.profiles
  where church_id = new.church_id;

  if user_count = 1 then
    insert into public.user_roles (user_id, church_id, role)
    values (new.user_id, new.church_id, 'pastor')
    on conflict (user_id, church_id, role) do nothing;
  else
    insert into public.user_roles (user_id, church_id, role)
    values (new.user_id, new.church_id, 'membro')
    on conflict (user_id, church_id, role) do nothing;
  end if;

  return new;
end;
$function$;