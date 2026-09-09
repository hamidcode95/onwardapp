-- Time Anchor background push support
-- 1) Mirrors Time Anchors server-side so a scheduled job can find due alarms
--    even when no browser tab is open.
-- 2) Stores each device's Web Push subscription.
-- 3) Schedules the send-time-anchor-push Edge Function to run every minute.

create table if not exists public.time_anchors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  target_time timestamptz not null,
  fired boolean not null default false,
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.time_anchors enable row level security;

drop policy if exists "Users manage their own time anchors" on public.time_anchors;
create policy "Users manage their own time anchors"
  on public.time_anchors
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists time_anchors_due_idx
  on public.time_anchors (target_time)
  where fired = false and dismissed = false;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on public.push_subscriptions;
create policy "Users manage their own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Required extensions for scheduled HTTP calls.
-- If this errors due to permissions, enable both from
-- Supabase Dashboard -> Database -> Extensions instead, then re-run
-- just the "select cron.schedule(...)" block below.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove any previous schedule with the same name before re-creating it,
-- so this migration can be re-run safely.
select cron.unschedule('send-time-anchor-push-every-minute')
where exists (
  select 1 from cron.job where jobname = 'send-time-anchor-push-every-minute'
);

-- IMPORTANT: replace 'REPLACE_WITH_CRON_SECRET' below with the same random
-- value you set as the CRON_SECRET function secret, BEFORE running this in
-- the SQL Editor. Do not commit the real value to git.
select cron.schedule(
  'send-time-anchor-push-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://docxoelzwfoijsghjtql.supabase.co/functions/v1/send-time-anchor-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'REPLACE_WITH_CRON_SECRET'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);
