create extension if not exists pgcrypto;

create schema if not exists internal;
revoke all on schema internal from public;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz not null default timezone('utc', now()),
  display_name text,
  avatar_seed text,
  total_xp integer not null default 0,
  coins integer not null default 0,
  streak integer not null default 0,
  games_played integer not null default 0,
  wins integer not null default 0,
  perfect_clears integer not null default 0,
  daily_completions integer not null default 0,
  best_easy_ms integer,
  best_medium_ms integer,
  best_hard_ms integer,
  best_expert_ms integer,
  last_daily_completed_at timestamptz,
  campaign_state jsonb,
  selected_theme text not null default 'base' check (selected_theme in ('base', 'ocean', 'sunnyBlue')),
  city text
);

create table if not exists public.theme_unlocks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  theme_id text not null check (theme_id in ('base', 'ocean', 'sunnyBlue')),
  unlocked_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, theme_id)
);

create table if not exists public.daily_challenges (
  challenge_date date primary key,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  puzzle_seed text not null unique,
  puzzle jsonb not null,
  solution jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_key text not null,
  mode text not null check (mode in ('free', 'daily', 'campaign', 'super')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  elapsed_ms integer not null default 0,
  mistakes integer not null default 0,
  hints_used integer not null default 0,
  completed_at timestamptz,
  saved_state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, session_key)
);

create table if not exists public.daily_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null references public.daily_challenges(challenge_date) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  duration_ms integer not null check (duration_ms >= 0),
  mistakes integer not null default 0 check (mistakes >= 0),
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  accuracy numeric(5,2) generated always as (
    case
      when mistakes = 0 then 100.00
      else greatest(0, 100.00 - mistakes * 5)
    end
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  unique (challenge_date, user_id)
);

create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    avatar_seed,
    selected_theme
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_seed', 'sudoku-wave'),
    'base'
  )
  on conflict (id) do nothing;

  insert into public.theme_unlocks (user_id, theme_id)
  values (new.id, 'base')
  on conflict do nothing;

  return new;
end;
$$;

create or replace function public.register_password_user(
  p_email text,
  p_password text,
  p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text;
  normalized_name text;
  new_user_id uuid;
  now_utc timestamptz;
begin
  normalized_email := lower(trim(p_email));
  normalized_name := nullif(trim(p_display_name), '');

  if normalized_email is null or normalized_email = '' then
    raise exception 'Email is required';
  end if;

  if normalized_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Invalid email address';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  if exists (
    select 1
    from auth.users
    where lower(email) = normalized_email
      and deleted_at is null
  ) then
    raise exception 'User already registered';
  end if;

  new_user_id := gen_random_uuid();
  now_utc := timezone('utc', now());

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    email_change_token_current,
    reauthentication_token,
    created_at,
    updated_at,
    phone_change,
    phone_change_token,
    is_sso_user,
    is_anonymous
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    normalized_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now_utc,
    '',
    '',
    '',
    '',
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object(
      'display_name',
      coalesce(normalized_name, split_part(normalized_email, '@', 1)),
      'avatar_seed',
      'sudoku-wave'
    ),
    '',
    '',
    now_utc,
    now_utc,
    '',
    '',
    false,
    false
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  )
  values (
    normalized_email,
    new_user_id,
    jsonb_build_object(
      'sub',
      new_user_id::text,
      'email',
      normalized_email,
      'email_verified',
      true,
      'phone_verified',
      false
    ),
    'email',
    now_utc,
    now_utc
  );

  return new_user_id;
end;
$$;

revoke all on function public.register_password_user(text, text, text) from public;
grant execute on function public.register_password_user(text, text, text) to anon, authenticated;

do $$
declare
  author_email constant text := 'author@sudokumindgarden.app';
  author_password constant text := 'Preview123!';
  author_user_id uuid;
  now_utc timestamptz := timezone('utc', now());
begin
  select id
  into author_user_id
  from auth.users
  where lower(email) = author_email
    and deleted_at is null
  limit 1;

  if author_user_id is null then
    author_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      email_change_token_current,
      reauthentication_token,
      created_at,
      updated_at,
      phone_change,
      phone_change_token,
      is_sso_user,
      is_anonymous
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      author_user_id,
      'authenticated',
      'authenticated',
      author_email,
      extensions.crypt(author_password, extensions.gen_salt('bf')),
      now_utc,
      '',
      '',
      '',
      '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'display_name',
        'Author Preview',
        'avatar_seed',
        'sudoku-wave'
      ),
      '',
      '',
      now_utc,
      now_utc,
      '',
      '',
      false,
      false
    );
  else
    update auth.users
    set
      encrypted_password = extensions.crypt(author_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now_utc),
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      raw_user_meta_data = jsonb_build_object(
        'display_name',
        'Author Preview',
        'avatar_seed',
        'sudoku-wave'
      ),
      updated_at = now_utc
    where id = author_user_id;
  end if;

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  )
  values (
    author_email,
    author_user_id,
    jsonb_build_object(
      'sub',
      author_user_id::text,
      'email',
      author_email,
      'email_verified',
      true,
      'phone_verified',
      false
    ),
    'email',
    now_utc,
    now_utc
  )
  on conflict (provider_id, provider) do update
  set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = excluded.updated_at;

  insert into public.profiles (
    id,
    display_name,
    avatar_seed,
    total_xp,
    coins,
    streak,
    games_played,
    wins,
    perfect_clears,
    daily_completions,
    campaign_state,
    selected_theme,
    city
  )
  values (
    author_user_id,
    'Author Preview',
    'sudoku-wave',
    0,
    1000,
    0,
    0,
    0,
    0,
    0,
    jsonb_build_object(
      'currentNodeId', 'master-3',
      'completedNodeIds', jsonb_build_array(
        'sprout-1',
        'sprout-2',
        'sprout-3',
        'logic-1',
        'logic-2',
        'logic-3',
        'focus-1',
        'focus-2',
        'focus-3',
        'master-1',
        'master-2',
        'master-3'
      ),
      'claimedChestIds', jsonb_build_array(),
      'lastCompletedNodeId', 'master-3',
      'lastActiveDate', null
    ),
    'sunnyBlue',
    'Preview'
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    avatar_seed = excluded.avatar_seed,
    total_xp = excluded.total_xp,
    coins = excluded.coins,
    streak = excluded.streak,
    games_played = excluded.games_played,
    wins = excluded.wins,
    perfect_clears = excluded.perfect_clears,
    daily_completions = excluded.daily_completions,
    campaign_state = excluded.campaign_state,
    selected_theme = excluded.selected_theme,
    city = excluded.city,
    updated_at = timezone('utc', now());

  insert into public.theme_unlocks (user_id, theme_id)
  values
    (author_user_id, 'base'),
    (author_user_id, 'ocean'),
    (author_user_id, 'sunnyBlue')
  on conflict do nothing;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure internal.handle_new_user();

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists handle_sessions_updated_at on public.game_sessions;
create trigger handle_sessions_updated_at
  before update on public.game_sessions
  for each row execute procedure public.set_current_timestamp_updated_at();

alter table public.profiles enable row level security;
alter table public.theme_unlocks enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.game_sessions enable row level security;
alter table public.daily_attempts enable row level security;

drop policy if exists "profiles are visible for public leaderboard" on public.profiles;
create policy "profiles are visible for public leaderboard"
  on public.profiles
  for select
  using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles
  for insert
  with check ((select auth.uid()) = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles
  for update
  using ((select auth.uid()) = id);

drop policy if exists "users can read own theme unlocks" on public.theme_unlocks;
create policy "users can read own theme unlocks"
  on public.theme_unlocks
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own theme unlocks" on public.theme_unlocks;
create policy "users can insert own theme unlocks"
  on public.theme_unlocks
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "daily challenges are visible to everyone" on public.daily_challenges;
create policy "daily challenges are visible to everyone"
  on public.daily_challenges
  for select
  using (true);

drop policy if exists "users can read own sessions" on public.game_sessions;
create policy "users can read own sessions"
  on public.game_sessions
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own sessions" on public.game_sessions;
create policy "users can insert own sessions"
  on public.game_sessions
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own sessions" on public.game_sessions;
create policy "users can update own sessions"
  on public.game_sessions
  for update
  using ((select auth.uid()) = user_id);

drop policy if exists "users can delete own sessions" on public.game_sessions;
create policy "users can delete own sessions"
  on public.game_sessions
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "daily attempts are readable for leaderboard" on public.daily_attempts;
create policy "daily attempts are readable for leaderboard"
  on public.daily_attempts
  for select
  using (true);

drop policy if exists "users can insert own daily attempts" on public.daily_attempts;
create policy "users can insert own daily attempts"
  on public.daily_attempts
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own daily attempts" on public.daily_attempts;
create policy "users can update own daily attempts"
  on public.daily_attempts
  for update
  using ((select auth.uid()) = user_id);

comment on table public.daily_challenges is 'Shared UTC-seeded puzzle for each calendar day.';
comment on table public.daily_attempts is 'Leaderboard entries for a user on the daily challenge.';
comment on table public.game_sessions is 'Cloud save payloads for resume-on-return gameplay.';
