-- ApplyIQ Database Schema
-- This script creates all necessary tables for the job application tracker

-- 1. Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- 2. Create job_applications table
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  position text not null,
  location text,
  salary_min integer,
  salary_max integer,
  job_type text check (job_type in ('full-time', 'part-time', 'contract', 'internship', 'remote')),
  status text not null default 'applied' check (status in ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  applied_date date default current_date,
  notes text,
  job_url text,
  contact_name text,
  contact_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_applications enable row level security;

create policy "applications_select_own" on public.job_applications for select using (auth.uid() = user_id);
create policy "applications_insert_own" on public.job_applications for insert with check (auth.uid() = user_id);
create policy "applications_update_own" on public.job_applications for update using (auth.uid() = user_id);
create policy "applications_delete_own" on public.job_applications for delete using (auth.uid() = user_id);

-- 3. Create resumes table
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text,
  extracted_skills text[],
  analysis_result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.resumes enable row level security;

create policy "resumes_select_own" on public.resumes for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.resumes for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.resumes for update using (auth.uid() = user_id);
create policy "resumes_delete_own" on public.resumes for delete using (auth.uid() = user_id);

-- 4. Create user_skills table
create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  proficiency_level integer check (proficiency_level between 1 and 5),
  category text,
  created_at timestamptz default now()
);

alter table public.user_skills enable row level security;

create policy "skills_select_own" on public.user_skills for select using (auth.uid() = user_id);
create policy "skills_insert_own" on public.user_skills for insert with check (auth.uid() = user_id);
create policy "skills_update_own" on public.user_skills for update using (auth.uid() = user_id);
create policy "skills_delete_own" on public.user_skills for delete using (auth.uid() = user_id);

-- 5. Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('application', 'interview', 'offer', 'reminder', 'system')),
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert_own" on public.notifications for insert with check (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_delete_own" on public.notifications for delete using (auth.uid() = user_id);

-- 6. Create user_settings table
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  email_notifications boolean default true,
  push_notifications boolean default true,
  weekly_digest boolean default true,
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.user_settings for update using (auth.uid() = user_id);
create policy "settings_delete_own" on public.user_settings for delete using (auth.uid() = user_id);

-- 7. Create trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  -- Also create default settings for the user
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create indexes for better performance
create index if not exists idx_job_applications_user_id on public.job_applications(user_id);
create index if not exists idx_job_applications_status on public.job_applications(status);
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_user_skills_user_id on public.user_skills(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
