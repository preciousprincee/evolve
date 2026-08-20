-- ============================================================================
-- Romantic Mode
-- Adds an opt-in toggle that shifts the companion's chat tone to be warmer
-- and more affectionate. Restricted to adult users (age >= 18) — enforced
-- again at the application layer in profileService.js, but the DB check is
-- kept as defense in depth in case a row is ever written outside the API.
-- ============================================================================
alter table public.profiles
  add column romantic_mode_enabled boolean not null default false;

alter table public.profiles
  add constraint romantic_mode_requires_adult
  check (romantic_mode_enabled = false or (age is not null and age >= 18));

comment on column public.profiles.romantic_mode_enabled is
  'User opt-in for a warmer/more affectionate chat tone. Adults only (age >= 18) — see romantic_mode_requires_adult check.';
