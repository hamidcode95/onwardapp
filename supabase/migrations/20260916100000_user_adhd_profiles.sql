-- Stores the result of the "Your ADHD Profile" onboarding Journey.
--
-- This is a personalization profile, NOT a diagnostic instrument. The
-- scores describe self-reported difficulty in each area so the app (and
-- Oly) can adapt; they are not a measure of ADHD severity.
--
-- Raw answers (0-4 per question) are stored alongside the derived scores
-- deliberately: the scoring model is versioned and may change, and we
-- never want to have thrown away the user's original responses.

create table if not exists public.user_adhd_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  completed_at timestamptz not null default now(),
  questionnaire_version text not null default 'v1',

  -- Raw answers, 0 = Never ... 4 = Almost always
  question_1 smallint not null check (question_1 between 0 and 4),
  question_2 smallint not null check (question_2 between 0 and 4),
  question_3 smallint not null check (question_3 between 0 and 4),
  question_4 smallint not null check (question_4 between 0 and 4),
  question_5 smallint not null check (question_5 between 0 and 4),
  question_6 smallint not null check (question_6 between 0 and 4),
  question_7 smallint not null check (question_7 between 0 and 4),
  question_8 smallint not null check (question_8 between 0 and 4),
  question_9 smallint not null check (question_9 between 0 and 4),
  question_10 smallint not null check (question_10 between 0 and 4),

  -- Derived 1-10 "challenge level" per dimension
  attention_score smallint not null check (attention_score between 1 and 10),
  executive_function_score smallint not null check (executive_function_score between 1 and 10),
  task_management_score smallint not null check (task_management_score between 1 and 10),
  hyperactivity_score smallint not null check (hyperactivity_score between 1 and 10),
  impulsivity_score smallint not null check (impulsivity_score between 1 and 10),
  emotional_regulation_score smallint not null check (emotional_regulation_score between 1 and 10),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One current profile per user. Retaking the Journey updates this row
-- rather than accumulating attempts: the app only ever needs "the user's
-- current profile", and keeping a single row keeps both the first-login
-- check and the AI's profile lookup trivial. If attempt history is
-- wanted later, add a separate append-only history table rather than
-- dropping this constraint.
create unique index if not exists user_adhd_profiles_user_id_key
  on public.user_adhd_profiles (user_id);

alter table public.user_adhd_profiles enable row level security;

-- Users may only ever see or modify their own profile. The AI Edge
-- Function queries this table with the caller's own JWT, so these same
-- policies are what prevent user A's request from reading user B's
-- profile.
drop policy if exists "Users read their own adhd profile" on public.user_adhd_profiles;
create policy "Users read their own adhd profile"
  on public.user_adhd_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users create their own adhd profile" on public.user_adhd_profiles;
create policy "Users create their own adhd profile"
  on public.user_adhd_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own adhd profile" on public.user_adhd_profiles;
create policy "Users update their own adhd profile"
  on public.user_adhd_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_adhd_profiles_set_updated_at on public.user_adhd_profiles;
create trigger user_adhd_profiles_set_updated_at
  before update on public.user_adhd_profiles
  for each row
  execute function public.set_updated_at();
