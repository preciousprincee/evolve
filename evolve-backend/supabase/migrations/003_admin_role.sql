-- ============================================================================
-- Admin role
-- Adds a role flag to profiles for the internal admin dashboard. There is
-- intentionally NO API path that lets a user set their own role (it's not
-- part of updateProfileSchema, and profileService.updateProfile only ever
-- writes the fields validated there) — the only way to grant admin is a
-- direct DB update, run manually by you. See PRODUCTION.md.
-- ============================================================================
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

create index idx_profiles_role on public.profiles (role) where role = 'admin';

-- Speeds up the admin dashboard's user search/list (name, nickname, created_at).
create index idx_profiles_created_at on public.profiles (created_at desc);
create index idx_profiles_nickname_search on public.profiles using gin (
  to_tsvector('simple', coalesce(nickname, '') || ' ' || coalesce(name, ''))
);

comment on column public.profiles.role is 'user | admin. Grant manually via SQL — never exposed through the profile update API.';
