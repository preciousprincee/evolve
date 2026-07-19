-- ============================================================================
-- Evolve — Initial Schema Migration
-- Run via Supabase SQL Editor or `supabase db push`
-- ============================================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. PROFILES
-- 1:1 with auth.users. id IS the auth.users.id (no separate PK).
-- ============================================================================
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text,
  nickname          text,
  age               int check (age is null or (age >= 13 and age <= 120)),
  career            text,
  goals             text[] default '{}',
  hobbies           text[] default '{}',
  personality       text,
  love_language     text,
  companion_style   text,
  current_mood      text default 'neutral',
  is_guest          boolean default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'One row per user, 1:1 with auth.users.';

-- ============================================================================
-- 2. RELATIONSHIP PROGRESS
-- 1:1 with user.
-- ============================================================================
create table public.relationship_progress (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  level                 text not null default 'Stranger'
                          check (level in ('Stranger','Friend','Close Friend','Companion','Best Friend','Trusted Partner')),
  xp                    int not null default 0 check (xp >= 0),
  days_together         int not null default 0 check (days_together >= 0),
  conversation_streak   int not null default 0 check (conversation_streak >= 0),
  last_interaction_at   timestamptz,
  updated_at            timestamptz not null default now()
);

-- ============================================================================
-- 3. MEMORIES
-- ============================================================================
create table public.memories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text not null check (category in (
                  'goal','dream','song','movie','book','birthday','friend','family',
                  'achievement','fear','habit','career','study_progress',
                  'health_preference','inside_joke','important_moment','other'
                )),
  content      text not null check (char_length(content) <= 2000),
  metadata     jsonb default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================================
-- 4. MESSAGES
-- Continuous per-user stream — no conversation/thread entity.
-- ============================================================================
create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('user','assistant')),
  content      text not null check (char_length(content) <= 8000),
  credits_cost int default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- 5. CREDITS
-- 1:1 per user. Balance mutated ONLY via deduct_credits() RPC below.
-- ============================================================================
create table public.credits (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  balance          int not null default 500 check (balance >= 0),
  cycle_reset_at   timestamptz not null default (now() + interval '1 month'),
  updated_at       timestamptz not null default now()
);

-- ============================================================================
-- 6. DAILY USAGE
-- ============================================================================
create table public.daily_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  usage_date      date not null default current_date,
  requests_count  int not null default 0,
  credits_spent   int not null default 0,
  unique (user_id, usage_date)
);

-- ============================================================================
-- 7. NOTIFICATIONS
-- ============================================================================
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null check (type in (
                  'good_morning','good_night','career_reminder','study_reminder',
                  'birthday_reminder','check_in','motivational','achievement','inactivity'
                )),
  payload      jsonb default '{}',
  sent_at      timestamptz not null default now(),
  read_at      timestamptz
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_memories_user_category on public.memories (user_id, category);
create index idx_messages_user_created on public.messages (user_id, created_at desc);
create index idx_daily_usage_user_date on public.daily_usage (user_id, usage_date desc);
create index idx_notifications_user_sent on public.notifications (user_id, sent_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Every table: enabled, and scoped strictly to auth.uid() = user_id (or id).
-- No public/anon access. No policy ever trusts a client-supplied user_id.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.relationship_progress enable row level security;
alter table public.memories enable row level security;
alter table public.messages enable row level security;
alter table public.credits enable row level security;
alter table public.daily_usage enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- No insert policy for clients — profile rows are created only by the
-- handle_new_user() trigger below (SECURITY DEFINER), never by direct client insert.
-- No delete policy — account deletion goes through a server-side admin flow.

-- relationship_progress
create policy "relationship_select_own" on public.relationship_progress
  for select using (auth.uid() = user_id);
-- No client insert/update/delete: XP and levels are mutated only by the
-- backend using the service-role key (bypasses RLS by design), never by the client.

-- memories
create policy "memories_select_own" on public.memories
  for select using (auth.uid() = user_id);
create policy "memories_insert_own" on public.memories
  for insert with check (auth.uid() = user_id);
create policy "memories_update_own" on public.memories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memories_delete_own" on public.memories
  for delete using (auth.uid() = user_id);

-- messages
create policy "messages_select_own" on public.messages
  for select using (auth.uid() = user_id);
-- No client insert policy: messages are written only by the backend after
-- Groq responds / user input is validated server-side. This prevents a client
-- from forging assistant messages or writing messages that bypass credit checks.

-- credits
create policy "credits_select_own" on public.credits
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy for clients whatsoever. Balance changes
-- happen exclusively through the deduct_credits() SECURITY DEFINER function
-- below, called by the backend on behalf of the verified user.

-- daily_usage
create policy "daily_usage_select_own" on public.daily_usage
  for select using (auth.uid() = user_id);
-- No client writes — backend-only via service role.

-- notifications
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- No client insert/delete — notifications are generated server-side (cron/daily-moments job).

-- ============================================================================
-- TRIGGER: auto-provision profile + relationship_progress + credits
-- Fires for both normal signups AND anonymous (guest) sign-ins, since both
-- create a row in auth.users.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, is_guest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Friend'),
    (new.is_anonymous is true)
  );

  insert into public.relationship_progress (user_id)
  values (new.id);

  insert into public.credits (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RPC: deduct_credits
-- Atomically checks balance and deducts in one transaction using row-level
-- locking (FOR UPDATE), preventing race conditions from concurrent requests.
-- SECURITY DEFINER so it can update the credits table despite no client
-- write policy existing — but it ALWAYS uses auth.uid() internally, never
-- a client-supplied user id, so a user can only ever deduct their own credits.
-- ============================================================================
create or replace function public.deduct_credits(p_amount int)
returns table (success boolean, remaining int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance int;
  v_reset_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  select balance, cycle_reset_at into v_balance, v_reset_at
  from public.credits
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'credits row missing for user';
  end if;

  -- monthly reset if cycle has elapsed
  if v_reset_at <= now() then
    v_balance := 500;
    update public.credits
      set balance = v_balance,
          cycle_reset_at = now() + interval '1 month',
          updated_at = now()
      where user_id = v_user_id;
  end if;

  if v_balance < p_amount then
    return query select false, v_balance;
    return;
  end if;

  update public.credits
    set balance = balance - p_amount,
        updated_at = now()
    where user_id = v_user_id;

  insert into public.daily_usage (user_id, usage_date, requests_count, credits_spent)
  values (v_user_id, current_date, 1, p_amount)
  on conflict (user_id, usage_date)
  do update set
    requests_count = public.daily_usage.requests_count + 1,
    credits_spent = public.daily_usage.credits_spent + p_amount;

  return query select true, (v_balance - p_amount);
end;
$$;

-- Only authenticated users may call this RPC (enforced by GRANT + internal auth.uid() check)
revoke all on function public.deduct_credits(int) from public;
grant execute on function public.deduct_credits(int) to authenticated;
