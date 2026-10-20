-- Make _user_label private.
-- It returns any user's email and name for a user id. Until now any signed-in
-- user could call it directly at /rest/v1/rpc/_user_label.
-- The website never calls it directly. It is only used inside other database
-- functions (class_detail, admin_list_teachers, my_invites, my_classes_and_tasks),
-- and those run as the owner, so they keep working after this change.

begin;

revoke execute on function public._user_label(uuid) from public, anon, authenticated;

commit;

-- VERIFY: should return only postgres and service_role
select grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema = 'public' and routine_name = '_user_label'
order by grantee;
