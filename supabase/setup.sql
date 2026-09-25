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

create table if not exists public.project_memberships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in (
    'admin',
    'project_manager',
    'technical_office',
    'site_engineer',
    'qa_qc',
    'planner',
    'viewer'
  )),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
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

create table if not exists public.quality_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  record_no text not null,
  record_type text not null check (record_type in ('inspection','itp','ncr','test')),
  title text not null,
  status text not null default 'open' check (status in ('open','closed','approved')),
  result text not null default 'pending' check (result in ('pending','passed','failed','conditional')),
  record_date date,
  created_at timestamptz not null default now(),
  unique(project_id, record_no)
);

create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  drawing_no text not null,
  title text not null,
  revision text not null,
  status text not null default 'current' check (status in ('current','superseded','hold','approved')),
  issued_at date,
  created_at timestamptz not null default now(),
  unique(project_id, drawing_no, revision)
);

create table if not exists public.rfis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  rfi_no text not null,
  subject text not null,
  status text not null default 'open' check (status in ('open','answered','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  due_date date,
  created_at timestamptz not null default now(),
  unique(project_id, rfi_no)
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  report_date date not null,
  weather text,
  manpower integer not null default 0 check (manpower >= 0),
  progress_notes text not null,
  shift_notes text,
  status text not null default 'draft' check (status in ('draft','submitted','approved')),
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  unit text not null,
  minimum_stock numeric not null default 0 check (minimum_stock >= 0),
  created_at timestamptz not null default now(),
  unique(project_id, code)
);

create table if not exists public.material_movements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  movement_type text not null check (movement_type in ('in','out')),
  quantity numeric not null check (quantity > 0),
  movement_date date not null,
  reference_no text,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.has_project_role(p_project_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_memberships pm
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid()
      and (p_roles is null or pm.role = any(p_roles))
  );
$$;

create or replace function public.can_view_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_project_role(p_project_id, null);
$$;

create or replace function public.can_manage_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_project_role(p_project_id, array['admin','project_manager']);
$$;

create or replace function public.can_edit_core(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_project_role(
    p_project_id,
    array['admin','project_manager','technical_office','site_engineer']
  );
$$;

create or replace function public.can_edit_quality(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_project_role(
    p_project_id,
    array['admin','project_manager','technical_office','qa_qc']
  );
$$;

create or replace function public.can_edit_planning(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_project_role(
    p_project_id,
    array['admin','project_manager','technical_office','planner']
  );
$$;

create or replace function public.bootstrap_project_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_memberships(project_id,user_id,role,created_by)
  values(new.id,new.owner_id,'admin',new.owner_id)
  on conflict(project_id,user_id) do update set role='admin';
  return new;
end;
$$;

drop trigger if exists projects_bootstrap_admin on public.projects;
create trigger projects_bootstrap_admin
after insert on public.projects
for each row execute function public.bootstrap_project_admin();

create or replace function public.protect_project_owner()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id and auth.uid() is distinct from old.owner_id then
    raise exception 'Only the project owner can transfer ownership.';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_protect_owner on public.projects;
create trigger projects_protect_owner
before update on public.projects
for each row execute function public.protect_project_owner();

alter table public.projects enable row level security;
alter table public.project_memberships enable row level security;
alter table public.areas enable row level security;
alter table public.activities enable row level security;
alter table public.quality_records enable row level security;
alter table public.drawings enable row level security;
alter table public.rfis enable row level security;
alter table public.daily_reports enable row level security;
alter table public.materials enable row level security;
alter table public.material_movements enable row level security;

drop policy if exists projects_select_own on public.projects;
drop policy if exists projects_insert_own on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_delete_own on public.projects;
drop policy if exists projects_select_member on public.projects;
drop policy if exists projects_update_manager on public.projects;
drop policy if exists projects_delete_manager on public.projects;

create policy projects_select_member on public.projects
for select to authenticated
using (public.can_view_project(id));

create policy projects_insert_own on public.projects
for insert to authenticated
with check (owner_id = auth.uid());

create policy projects_update_manager on public.projects
for update to authenticated
using (public.can_manage_project(id))
with check (public.can_manage_project(id));

create policy projects_delete_manager on public.projects
for delete to authenticated
using (public.can_manage_project(id));

drop policy if exists memberships_select_project on public.project_memberships;
drop policy if exists memberships_write_manager on public.project_memberships;

create policy memberships_select_project on public.project_memberships
for select to authenticated
using (public.can_view_project(project_id));

create policy memberships_write_manager on public.project_memberships
for all to authenticated
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

drop policy if exists areas_select_own_project on public.areas;
drop policy if exists areas_write_own_project on public.areas;
drop policy if exists areas_select_member on public.areas;
drop policy if exists areas_write_core on public.areas;

create policy areas_select_member on public.areas
for select to authenticated
using (public.can_view_project(project_id));

create policy areas_write_core on public.areas
for all to authenticated
using (public.can_edit_core(project_id))
with check (public.can_edit_core(project_id));

drop policy if exists activities_select_own_project on public.activities;
drop policy if exists activities_write_own_project on public.activities;
drop policy if exists activities_select_member on public.activities;
drop policy if exists activities_write_core on public.activities;

create policy activities_select_member on public.activities
for select to authenticated
using (public.can_view_project(project_id));

create policy activities_write_core on public.activities
for all to authenticated
using (public.can_edit_core(project_id))
with check (public.can_edit_core(project_id));

drop policy if exists quality_select_own_project on public.quality_records;
drop policy if exists quality_write_own_project on public.quality_records;
drop policy if exists quality_select_member on public.quality_records;
drop policy if exists quality_write_role on public.quality_records;

create policy quality_select_member on public.quality_records
for select to authenticated
using (public.can_view_project(project_id));

create policy quality_write_role on public.quality_records
for all to authenticated
using (public.can_edit_quality(project_id))
with check (public.can_edit_quality(project_id));

drop policy if exists drawings_select_own_project on public.drawings;
drop policy if exists drawings_write_own_project on public.drawings;
drop policy if exists drawings_select_member on public.drawings;
drop policy if exists drawings_write_core on public.drawings;

create policy drawings_select_member on public.drawings
for select to authenticated
using (public.can_view_project(project_id));

create policy drawings_write_core on public.drawings
for all to authenticated
using (public.can_edit_core(project_id))
with check (public.can_edit_core(project_id));

drop policy if exists rfis_select_own_project on public.rfis;
drop policy if exists rfis_write_own_project on public.rfis;
drop policy if exists rfis_select_member on public.rfis;
drop policy if exists rfis_write_core on public.rfis;

create policy rfis_select_member on public.rfis
for select to authenticated
using (public.can_view_project(project_id));

create policy rfis_write_core on public.rfis
for all to authenticated
using (public.can_edit_core(project_id))
with check (public.can_edit_core(project_id));

drop policy if exists daily_reports_select_own_project on public.daily_reports;
drop policy if exists daily_reports_write_own_project on public.daily_reports;
drop policy if exists daily_reports_select_member on public.daily_reports;
drop policy if exists daily_reports_write_core on public.daily_reports;

create policy daily_reports_select_member on public.daily_reports
for select to authenticated
using (public.can_view_project(project_id));

create policy daily_reports_write_core on public.daily_reports
for all to authenticated
using (public.can_edit_core(project_id))
with check (public.can_edit_core(project_id));

drop policy if exists materials_select_own_project on public.materials;
drop policy if exists materials_write_own_project on public.materials;
drop policy if exists materials_select_member on public.materials;
drop policy if exists materials_write_core on public.materials;

create policy materials_select_member on public.materials
for select to authenticated
using (public.can_view_project(project_id));

create policy materials_write_core on public.materials
for all to authenticated
using (public.can_edit_core(project_id))
with check (public.can_edit_core(project_id));

drop policy if exists material_movements_select_own_project on public.material_movements;
drop policy if exists material_movements_write_own_project on public.material_movements;
drop policy if exists material_movements_select_member on public.material_movements;
drop policy if exists material_movements_write_core on public.material_movements;

create policy material_movements_select_member on public.material_movements
for select to authenticated
using (public.can_view_project(project_id));

create policy material_movements_write_core on public.material_movements
for all to authenticated
using (public.can_edit_core(project_id))
with check (public.can_edit_core(project_id));

grant select, insert, update, delete on
  public.projects,
  public.project_memberships,
  public.areas,
  public.activities,
  public.quality_records,
  public.drawings,
  public.rfis,
  public.daily_reports,
  public.materials,
  public.material_movements
to authenticated;

grant execute on function public.has_project_role(uuid,text[]) to authenticated;
grant execute on function public.can_view_project(uuid) to authenticated;
grant execute on function public.can_manage_project(uuid) to authenticated;
grant execute on function public.can_edit_core(uuid) to authenticated;
grant execute on function public.can_edit_quality(uuid) to authenticated;
grant execute on function public.can_edit_planning(uuid) to authenticated;
