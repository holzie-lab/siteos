create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  status text not null default 'planned',
  unique(project_id, code)
);

alter table public.projects enable row level security;
alter table public.activities enable row level security;
