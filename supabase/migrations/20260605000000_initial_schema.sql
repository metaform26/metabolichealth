-- ─────────────────────────────────────────────────────────────────────────────
-- Metabolic Health App — initial schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  role        text not null default 'patient' check (role in ('patient','clinician','coach','admin')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- ── Auto-create profile on sign-up ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'patient'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── user_health_profiles ─────────────────────────────────────────────────────
create table public.user_health_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null unique,
  age               int,
  sex               text check (sex in ('male','female')),
  height_inches     numeric,
  weight_lbs        numeric,
  body_fat_percent  numeric,
  waist_inches      numeric,
  activity_level    text,
  goal              text,
  on_glp1           boolean default false,
  symptoms          text[] default '{}',
  conditions        text[] default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.user_health_profiles enable row level security;

create policy "Users manage their own health profile"
  on public.user_health_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── meal_logs ─────────────────────────────────────────────────────────────────
create table public.meal_logs (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  logged_at           timestamptz not null default now(),
  meal_type           text,
  name                text not null,
  calories            numeric not null default 0,
  protein_g           numeric not null default 0,
  carbs_g             numeric,
  fat_g               numeric,
  fiber_g             numeric,
  serving_description text,
  source              text default 'manual' check (source in ('manual','photo','api'))
);

alter table public.meal_logs enable row level security;

create policy "Users manage their own meal logs"
  on public.meal_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── daily_tracking ───────────────────────────────────────────────────────────
create table public.daily_tracking (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  date                date not null default current_date,
  steps               int,
  water_ml            numeric,
  sleep_hours         numeric,
  heart_rate_resting  int,
  glucose_fasting     numeric,
  glucose_post_meal   numeric,
  exercise_minutes    int,
  notes               text,
  unique (user_id, date)
);

alter table public.daily_tracking enable row level security;

create policy "Users manage their own daily tracking"
  on public.daily_tracking for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── progress_check_ins ───────────────────────────────────────────────────────
create table public.progress_check_ins (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  date             date not null default current_date,
  weight_lbs       numeric,
  waist_inches     numeric,
  body_fat_percent numeric,
  target_weight    numeric,
  notes            text,
  created_at       timestamptz not null default now()
);

alter table public.progress_check_ins enable row level security;

create policy "Users manage their own check-ins"
  on public.progress_check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── messages ─────────────────────────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  from_id     uuid references auth.users(id) on delete cascade not null,
  to_id       uuid references auth.users(id) on delete cascade not null,
  subject     text,
  body        text not null,
  read        boolean default false,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can see messages sent to them"
  on public.messages for select
  using (auth.uid() = to_id or auth.uid() = from_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = from_id);

create policy "Recipients can mark messages read"
  on public.messages for update
  using (auth.uid() = to_id);

-- ── subscriptions ────────────────────────────────────────────────────────────
create table public.subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null unique,
  plan            text not null default 'basic' check (plan in ('basic','coach','clinical')),
  billing_cycle   text default 'monthly' check (billing_cycle in ('monthly','yearly')),
  status          text default 'active' check (status in ('active','cancelled','past_due')),
  stripe_id       text,
  started_at      timestamptz not null default now(),
  expires_at      timestamptz
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ── updated_at trigger (reusable) ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_health_profiles_updated_at
  before update on public.user_health_profiles
  for each row execute procedure public.set_updated_at();
