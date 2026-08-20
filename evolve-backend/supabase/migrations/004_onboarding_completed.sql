-- ============================================================================
-- Onboarding completion tracking
-- Previously nothing recorded whether a user had finished onboarding, so
-- every login path except signup/guest hardcoded a redirect to /home —
-- sign-in, Google OAuth, and the email-confirmation redirect all skipped
-- onboarding entirely for new users. This column + ProtectedRoute checking
-- it (frontend) makes onboarding a real gate regardless of entry path.
-- ============================================================================
alter table public.profiles
  add column onboarding_completed boolean not null default false;
