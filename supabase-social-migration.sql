-- ============================================================
-- PeakSet Social Features Migration
-- Paste this into your Supabase SQL Editor and click Run
-- ============================================================

-- 1. User profiles table (publicly searchable)
create table if not exists public.user_profiles (
  user_id    uuid    primary key references auth.users(id) on delete cascade,
  profile_name text  not null default '',
  email      text,
  weight_lbs numeric,
  height_in  integer,
  split_id   text,
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='user_profiles' and policyname='profiles_public_read') then
    create policy "profiles_public_read" on public.user_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='user_profiles' and policyname='profiles_own_all') then
    create policy "profiles_own_all"    on public.user_profiles for all    using (auth.uid() = user_id);
  end if;
end $$;

-- 2. Friendships table
create table if not exists public.friendships (
  id           uuid    primary key default gen_random_uuid(),
  requester_id uuid    not null references auth.users(id) on delete cascade,
  addressee_id uuid    not null references auth.users(id) on delete cascade,
  status       text    not null default 'pending' check (status in ('pending','accepted')),
  created_at   timestamptz default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='friendships' and policyname='friendships_read') then
    create policy "friendships_read"   on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='friendships' and policyname='friendships_insert') then
    create policy "friendships_insert" on public.friendships for insert with check (auth.uid() = requester_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='friendships' and policyname='friendships_update') then
    create policy "friendships_update" on public.friendships for update using (auth.uid() = addressee_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='friendships' and policyname='friendships_delete') then
    create policy "friendships_delete" on public.friendships for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);
  end if;
end $$;

-- 3. Allow friends to read each other's workout data
--    These are additive SELECT policies; existing own-user policies are unaffected.

do $$ begin
  -- workouts
  if not exists (select 1 from pg_policies where tablename='workouts' and policyname='workouts_friends_read') then
    create policy "workouts_friends_read" on public.workouts for select using (
      exists (
        select 1 from public.friendships
        where status = 'accepted'
          and ((requester_id = auth.uid() and addressee_id = user_id)
            or (addressee_id = auth.uid() and requester_id = user_id))
      )
    );
  end if;

  -- workout_exercises
  if not exists (select 1 from pg_policies where tablename='workout_exercises' and policyname='workout_exercises_friends_read') then
    create policy "workout_exercises_friends_read" on public.workout_exercises for select using (
      exists (
        select 1 from public.workouts w
        join public.friendships f
          on f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = w.user_id)
            or (f.addressee_id = auth.uid() and f.requester_id = w.user_id))
        where w.id = workout_id
      )
    );
  end if;

  -- exercise_sets
  if not exists (select 1 from pg_policies where tablename='exercise_sets' and policyname='exercise_sets_friends_read') then
    create policy "exercise_sets_friends_read" on public.exercise_sets for select using (
      exists (
        select 1 from public.workout_exercises we
        join public.workouts w on w.id = we.workout_id
        join public.friendships f
          on f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = w.user_id)
            or (f.addressee_id = auth.uid() and f.requester_id = w.user_id))
        where we.id = workout_exercise_id
      )
    );
  end if;

  -- body_weight
  if not exists (select 1 from pg_policies where tablename='body_weight' and policyname='body_weight_friends_read') then
    create policy "body_weight_friends_read" on public.body_weight for select using (
      exists (
        select 1 from public.friendships
        where status = 'accepted'
          and ((requester_id = auth.uid() and addressee_id = user_id)
            or (addressee_id = auth.uid() and requester_id = user_id))
      )
    );
  end if;
end $$;
