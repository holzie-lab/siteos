create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  code text not null,
  name text not null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, code)
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique(project_id, code)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  code text not null,
  name text not null,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  status text not null default 'planned' check (status in ('planned','in_progress','on_hold','completed')),
  quantity numeric check (quantity is null or quantity >= 0),
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, code),
  check (quantity is null or nullif(trim(unit),'') is not null)
);

create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where id = p_project_id and owner_id = auth.uid()
  );
$$;

alter table public.projects enable row level security;
alter table public.areas enable row level security;
alter table public.activities enable row level security;

drop policy if exists projects_select_own on public.projects;
drop policy if exists projects_insert_own on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_delete_own on public.projects;

create policy projects_select_own on public.projects
for select to authenticated
using (owner_id = auth.uid());

create policy projects_insert_own on public.projects
for insert to authenticated
with check (owner_id = auth.uid());

create policy projects_update_own on public.projects
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy projects_delete_own on public.projects
for delete to authenticated
using (owner_id = auth.uid());

drop policy if exists areas_select_own_project on public.areas;
drop policy if exists areas_write_own_project on public.areas;

create policy areas_select_own_project on public.areas
for select to authenticated
using (public.owns_project(project_id));

create policy areas_write_own_project on public.areas
for all to authenticated
using (public.owns_project(project_id))
with check (public.owns_project(project_id));

drop policy if exists activities_select_own_project on public.activities;
drop policy if exists activities_write_own_project on public.activities;

create policy activities_select_own_project on public.activities
for select to authenticated
using (public.owns_project(project_id));

create policy activities_write_own_project on public.activities
for all to authenticated
using (public.owns_project(project_id))
with check (public.owns_project(project_id));

grant select, insert, update, delete on public.projects, public.areas, public.activities to authenticated;
grant execute on function public.owns_project(uuid) to authenticated;
