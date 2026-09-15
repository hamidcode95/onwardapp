-- Adds the new "yearly" plan tier alongside the existing monthly/lifetime
-- plans. Written as an ALTER (not an edit to the original migration file),
-- since that file may already be applied to the live database.

alter table public.payments
  drop constraint if exists payments_plan_check;
alter table public.payments
  add constraint payments_plan_check check (plan in ('monthly', 'yearly', 'lifetime'));

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('monthly', 'yearly', 'lifetime'));
