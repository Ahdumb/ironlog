-- ============================================================
-- PeakSet Push Notifications Migration
-- Paste into Supabase SQL Editor and click Run
-- ============================================================

create table if not exists public.push_subscriptions (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null references auth.users(id) on delete cascade,
  subscription  jsonb   not null,
  reminder_hour integer not null check (reminder_hour >= 0 and reminder_hour <= 23),
  created_at    timestamptz default now(),
  unique(user_id)
);

alter table public.push_subscriptions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'push_subscriptions' and policyname = 'push_subs_own'
  ) then
    create policy "push_subs_own"
      on public.push_subscriptions
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
