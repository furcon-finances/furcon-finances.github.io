-- Con Budget Planner: friends sync
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  con text,
  code text unique not null,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

create table if not exists members (
  group_id uuid references groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  name text,
  saved numeric default 0,
  goal numeric default 0,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists costs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups on delete cascade,
  label text,
  amount numeric not null default 0,
  paid_by uuid,
  split uuid[] not null default '{}',
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups on delete cascade,
  from_user uuid,
  to_user uuid,
  amount numeric,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups on delete cascade,
  user_id uuid,
  name text,
  kind text,
  text text,
  created_at timestamptz default now()
);

create or replace function is_member(g uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from members where group_id = g and user_id = auth.uid())
$$;

alter table profiles enable row level security;
alter table groups enable row level security;
alter table members enable row level security;
alter table costs enable row level security;
alter table settlements enable row level security;
alter table events enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "see my groups" on groups for select using (is_member(id));
create policy "see group members" on members for select using (is_member(group_id));
create policy "update my member row" on members for update using (user_id = auth.uid());
create policy "group costs" on costs for all using (is_member(group_id)) with check (is_member(group_id));
create policy "group settlements read" on settlements for select using (is_member(group_id));
create policy "group settlements add" on settlements for insert with check (is_member(group_id));
create policy "group events read" on events for select using (is_member(group_id));
create policy "group events add" on events for insert with check (is_member(group_id));

create or replace function create_group(p_name text, p_con text, p_member_name text) returns groups
language plpgsql security definer set search_path = public as $$
declare g groups;
begin
  insert into groups (name, con, code, created_by)
  values (p_name, p_con, 'G-' || upper(substr(md5(random()::text), 1, 6)), auth.uid())
  returning * into g;
  insert into members (group_id, user_id, name) values (g.id, auth.uid(), p_member_name);
  insert into events (group_id, user_id, name, kind, text) values (g.id, auth.uid(), p_member_name, 'joined', 'started the group');
  return g;
end $$;

create or replace function join_group(p_code text, p_member_name text) returns groups
language plpgsql security definer set search_path = public as $$
declare g groups;
begin
  select * into g from groups where code = upper(trim(p_code));
  if g.id is null then raise exception 'No group with that code'; end if;
  insert into members (group_id, user_id, name) values (g.id, auth.uid(), p_member_name)
  on conflict do nothing;
  if found then
    insert into events (group_id, user_id, name, kind, text) values (g.id, auth.uid(), p_member_name, 'joined', 'joined the group');
  end if;
  return g;
end $$;

alter publication supabase_realtime add table members, costs, settlements, events;
