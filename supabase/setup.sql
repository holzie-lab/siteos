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

alter table public.quality_records enable row level security;
alter table public.drawings enable row level security;
alter table public.rfis enable row level security;

drop policy if exists quality_select_own_project on public.quality_records;
drop policy if exists quality_write_own_project on public.quality_records;
create policy quality_select_own_project on public.quality_records for select to authenticated
using (public.owns_project(project_id));
create policy quality_write_own_project on public.quality_records for all to authenticated
using (public.owns_project(project_id)) with check (public.owns_project(project_id));

drop policy if exists drawings_select_own_project on public.drawings;
drop policy if exists drawings_write_own_project on public.drawings;
create policy drawings_select_own_project on public.drawings for select to authenticated
using (public.owns_project(project_id));
create policy drawings_write_own_project on public.drawings for all to authenticated
using (public.owns_project(project_id)) with check (public.owns_project(project_id));

drop policy if exists rfis_select_own_project on public.rfis;
drop policy if exists rfis_write_own_project on public.rfis;
create policy rfis_select_own_project on public.rfis for select to authenticated
using (public.owns_project(project_id));
create policy rfis_write_own_project on public.rfis for all to authenticated
using (public.owns_project(project_id)) with check (public.owns_project(project_id));

grant select, insert, update, delete on public.quality_records, public.drawings, public.rfis to authenticated;

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

alter table public.daily_reports enable row level security;
alter table public.materials enable row level security;
alter table public.material_movements enable row level security;

drop policy if exists daily_reports_select_own_project on public.daily_reports;
drop policy if exists daily_reports_write_own_project on public.daily_reports;
create policy daily_reports_select_own_project on public.daily_reports for select to authenticated
using (public.owns_project(project_id));
create policy daily_reports_write_own_project on public.daily_reports for all to authenticated
using (public.owns_project(project_id)) with check (public.owns_project(project_id));

drop policy if exists materials_select_own_project on public.materials;
drop policy if exists materials_write_own_project on public.materials;
create policy materials_select_own_project on public.materials for select to authenticated
using (public.owns_project(project_id));
create policy materials_write_own_project on public.materials for all to authenticated
using (public.owns_project(project_id)) with check (public.owns_project(project_id));

drop policy if exists material_movements_select_own_project on public.material_movements;
drop policy if exists material_movements_write_own_project on public.material_movements;
create policy material_movements_select_own_project on public.material_movements for select to authenticated
using (public.owns_project(project_id));
create policy material_movements_write_own_project on public.material_movements for all to authenticated
using (public.owns_project(project_id)) with check (public.owns_project(project_id));

grant select, insert, update, delete on public.daily_reports, public.materials, public.material_movements to authenticated;
