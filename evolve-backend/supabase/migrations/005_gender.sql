-- ============================================================================
-- Gender field
-- Collected once during onboarding. Used for two things: light
-- personalization in the companion prompt, and picking an AI voice on the
-- frontend that's opposite the user's selected gender (male user -> female
-- voice, female user -> male voice). Nullable — older rows and guests won't
-- have it set, and the frontend/prompt both already fall back gracefully
-- when a profile field is absent.
-- ============================================================================
alter table public.profiles
  add column gender text check (gender is null or gender in ('male', 'female'));
