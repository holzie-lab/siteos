create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

alter table public.projects enable row level security;
alter table public.areas enable row level security;
alter table public.activities enable row level security;

-- Development policy model: authenticated users can manage generic project records.
-- A project-membership model is planned before multi-tenant production use.
drop policy if exists projects_authenticated on public.projects;
create policy projects_authenticated on public.projects for all to authenticated using (true) with check (true);

drop policy if exists areas_authenticated on public.areas;
create policy areas_authenticated on public.areas for all to authenticated using (true) with check (true);

drop policy if exists activities_authenticated on public.activities;
create policy activities_authenticated on public.activities for all to authenticated using (true) with check (true);
