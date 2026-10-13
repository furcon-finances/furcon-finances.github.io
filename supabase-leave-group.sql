-- Run this once in Supabase > SQL Editor to enable "Leave group".
-- Safe to run more than once.
create or replace function leave_group(p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  select name into nm from members where group_id = p_group and user_id = auth.uid();
  if not found then return; end if;
  insert into events (group_id, user_id, name, kind, text) values (p_group, auth.uid(), nm, 'left', 'left the group');
  delete from members where group_id = p_group and user_id = auth.uid();
  if not exists (select 1 from members where group_id = p_group) then delete from groups where id = p_group; end if;
end $$;
