-- Payment gateway support (crypto first; Zarinpal columns/values reserved
-- for when that merchant account is ready).
--
-- Two tables:
-- 1. payments  — an append-only log of every payment attempt, one row per
--    attempt (pending/verified/failed). provider_ref is the thing that
--    makes an attempt unique per method (a crypto tx hash, or a Zarinpal
--    "Authority") — the unique index on it is what stops the same tx hash
--    or Authority from ever being credited twice.
-- 2. subscriptions — the current premium status per user, one row per
--    user, upserted whenever a payment verifies successfully. This is the
--    ONLY thing the app should ever check to decide if a user is premium
--    — never a client-side flag.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('zarinpal', 'crypto')),
  plan text not null check (plan in ('monthly', 'lifetime')),
  amount numeric not null,
  currency text not null, -- 'IRR' for Zarinpal, 'USDT' for crypto
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed')),
  provider_ref text, -- Zarinpal Authority, or the crypto transaction hash
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

alter table public.payments enable row level security;

drop policy if exists "Users manage their own payments" on public.payments;
create policy "Users manage their own payments"
  on public.payments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A given provider_ref (tx hash / Authority) may only ever be credited
-- once, globally — this is the replay-protection for crypto payments in
-- particular (someone re-submitting the same real tx hash, or an old tx
-- hash that already paid for someone else).
create unique index if not exists payments_method_provider_ref_verified_idx
  on public.payments (method, provider_ref)
  where status = 'verified';

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'lifetime')),
  status text not null default 'active' check (status in ('active', 'expired')),
  current_period_end timestamptz, -- null for lifetime
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users read their own subscription" on public.subscriptions;
create policy "Users read their own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for regular users on purpose — only the
-- payment-verifying Edge Functions (using the service role key, which
-- bypasses RLS) are allowed to write to this table. A user should never
-- be able to grant themselves premium status directly.
