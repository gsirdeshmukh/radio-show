-- Social graph, presence, inbox, location, and live session scaffolding.
-- Note: This migration is additive; see supabase/schema.sql for the full canonical schema.

-- Social: follows
create table if not exists public.follows (
  follower_id uuid references public.profiles (user_id) on delete cascade,
  followed_id uuid references public.profiles (user_id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followed_id),
  constraint follows_not_self check (follower_id <> followed_id)
);

create index if not exists follows_followed_idx on public.follows (followed_id, created_at desc);
create index if not exists follows_follower_idx on public.follows (follower_id, created_at desc);

alter table public.follows enable row level security;
drop policy if exists "follows read involved" on public.follows;
create policy "follows read involved" on public.follows
  for select
  using (auth.uid() is not null and (auth.uid() = follower_id or auth.uid() = followed_id));

drop policy if exists "follows insert own" on public.follows;
create policy "follows insert own" on public.follows
  for insert
  with check (auth.uid() = follower_id and follower_id <> followed_id);

drop policy if exists "follows delete own" on public.follows;
create policy "follows delete own" on public.follows
  for delete
  using (auth.uid() = follower_id);

-- Location: profile zip (private by default)
create table if not exists public.profile_locations (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  zip text,
  opt_in boolean default false,
  updated_at timestamptz default now()
);

create or replace function public.touch_profile_locations_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profile_locations_touch_updated_at on public.profile_locations;
create trigger profile_locations_touch_updated_at before update on public.profile_locations
for each row execute procedure public.touch_profile_locations_updated_at();

create index if not exists profile_locations_zip_idx on public.profile_locations (zip);

alter table public.profile_locations enable row level security;
drop policy if exists "profile_locations read own" on public.profile_locations;
create policy "profile_locations read own" on public.profile_locations
  for select
  using (auth.uid() = user_id);

drop policy if exists "profile_locations upsert own" on public.profile_locations;
create policy "profile_locations upsert own" on public.profile_locations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Presence: last seen (visible only to self + followers/friends)
create table if not exists public.profile_presence (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  last_seen_at timestamptz default now(),
  status text default 'online',
  updated_at timestamptz default now()
);

create or replace function public.touch_profile_presence_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profile_presence_touch_updated_at on public.profile_presence;
create trigger profile_presence_touch_updated_at before update on public.profile_presence
for each row execute procedure public.touch_profile_presence_updated_at();

create index if not exists profile_presence_last_seen_idx on public.profile_presence (last_seen_at desc);

alter table public.profile_presence enable row level security;
drop policy if exists "profile_presence read followers" on public.profile_presence;
create policy "profile_presence read followers" on public.profile_presence
  for select
  using (
    auth.uid() is not null
    and (
      auth.uid() = user_id
      or exists (
        select 1 from public.follows f
        where (f.follower_id = auth.uid() and f.followed_id = user_id)
           or (f.follower_id = user_id and f.followed_id = auth.uid())
      )
    )
  );

drop policy if exists "profile_presence upsert own" on public.profile_presence;
create policy "profile_presence upsert own" on public.profile_presence
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Location: per-session (public only if opted-in)
create table if not exists public.session_locations (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  zip text,
  opt_in boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.touch_session_locations_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists session_locations_touch_updated_at on public.session_locations;
create trigger session_locations_touch_updated_at before update on public.session_locations
for each row execute procedure public.touch_session_locations_updated_at();

create index if not exists session_locations_zip_idx on public.session_locations (zip);

alter table public.session_locations enable row level security;
drop policy if exists "session_locations read opted_in" on public.session_locations;
create policy "session_locations read opted_in" on public.session_locations
  for select
  using (
    opt_in = true
    or (
      auth.uid() is not null
      and exists (
        select 1 from public.sessions s
        where s.id = session_id and s.host_user_id = auth.uid()
      )
    )
  );

drop policy if exists "session_locations write owner" on public.session_locations;
create policy "session_locations write owner" on public.session_locations
  for all
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.host_user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.host_user_id = auth.uid()
    )
  );

-- Inbox: direct session shares (sender/receiver only)
create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles (user_id) on delete set null,
  to_user_id uuid references public.profiles (user_id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  note text,
  status text default 'unread',
  created_at timestamptz default now(),
  read_at timestamptz
);

create index if not exists inbox_items_to_idx on public.inbox_items (to_user_id, created_at desc);
create index if not exists inbox_items_from_idx on public.inbox_items (from_user_id, created_at desc);
create index if not exists inbox_items_session_idx on public.inbox_items (session_id, created_at desc);

alter table public.inbox_items enable row level security;
drop policy if exists "inbox_items read participants" on public.inbox_items;
create policy "inbox_items read participants" on public.inbox_items
  for select
  using (auth.uid() is not null and (auth.uid() = to_user_id or auth.uid() = from_user_id));

drop policy if exists "inbox_items insert sender" on public.inbox_items;
create policy "inbox_items insert sender" on public.inbox_items
  for insert
  with check (auth.uid() = from_user_id and to_user_id is not null);

drop policy if exists "inbox_items update receiver" on public.inbox_items;
create policy "inbox_items update receiver" on public.inbox_items
  for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

drop policy if exists "inbox_items delete participants" on public.inbox_items;
create policy "inbox_items delete participants" on public.inbox_items
  for delete
  using (auth.uid() is not null and (auth.uid() = to_user_id or auth.uid() = from_user_id));

-- Sessions visibility: add followers/friends/unlisted semantics (listing stays in Edge Functions)
drop policy if exists "sessions read public" on public.sessions;
create policy "sessions read allowed" on public.sessions
  for select
  using (
    visibility in ('public', 'unlisted')
    or (
      auth.uid() is not null
      and (
        host_user_id = auth.uid()
        or (
          visibility = 'followers'
          and exists (
            select 1 from public.follows f
            where (f.follower_id = auth.uid() and f.followed_id = host_user_id)
               or (f.follower_id = host_user_id and f.followed_id = auth.uid())
          )
        )
        or (
          visibility = 'friends'
          and exists (
            select 1 from public.follows f1
            where f1.follower_id = auth.uid() and f1.followed_id = host_user_id
          )
          and exists (
            select 1 from public.follows f2
            where f2.follower_id = host_user_id and f2.followed_id = auth.uid()
          )
        )
      )
    )
  );

-- Live: basic discovery + lifecycle. Streaming provider integration is handled in Edge Functions later.
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid references public.profiles (user_id) on delete cascade,
  title text,
  status text default 'live',
  visibility text default 'followers',
  zip text,
  location_opt_in boolean default false,
  room_name text,
  provider text default 'placeholder',
  created_at timestamptz default now(),
  started_at timestamptz default now(),
  ended_at timestamptz
);

create index if not exists live_sessions_status_idx on public.live_sessions (status, started_at desc);
create index if not exists live_sessions_host_idx on public.live_sessions (host_user_id, started_at desc);
create index if not exists live_sessions_zip_idx on public.live_sessions (zip, started_at desc);

alter table public.live_sessions enable row level security;
drop policy if exists "live_sessions read allowed" on public.live_sessions;
create policy "live_sessions read allowed" on public.live_sessions
  for select
  using (
    visibility = 'public'
    or (
      auth.uid() is not null
      and (
        host_user_id = auth.uid()
        or (
          visibility = 'followers'
          and exists (
            select 1 from public.follows f
            where (f.follower_id = auth.uid() and f.followed_id = host_user_id)
               or (f.follower_id = host_user_id and f.followed_id = auth.uid())
          )
        )
        or (
          visibility = 'friends'
          and exists (
            select 1 from public.follows f1
            where f1.follower_id = auth.uid() and f1.followed_id = host_user_id
          )
          and exists (
            select 1 from public.follows f2
            where f2.follower_id = host_user_id and f2.followed_id = auth.uid()
          )
        )
      )
    )
  );

drop policy if exists "live_sessions write host" on public.live_sessions;
create policy "live_sessions write host" on public.live_sessions
  for all
  using (auth.uid() is not null and auth.uid() = host_user_id)
  with check (auth.uid() is not null and auth.uid() = host_user_id);

create table if not exists public.live_events (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid references public.live_sessions (id) on delete cascade,
  user_id uuid references public.profiles (user_id) on delete set null,
  type text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists live_events_session_idx on public.live_events (live_session_id, created_at desc);

alter table public.live_events enable row level security;
drop policy if exists "live_events read session_viewers" on public.live_events;
create policy "live_events read session_viewers" on public.live_events
  for select
  using (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = live_session_id
        and (
          ls.visibility = 'public'
          or (
            auth.uid() is not null
            and (
              ls.host_user_id = auth.uid()
              or (
                ls.visibility = 'followers'
                and exists (
                  select 1 from public.follows f
                  where (f.follower_id = auth.uid() and f.followed_id = ls.host_user_id)
                     or (f.follower_id = ls.host_user_id and f.followed_id = auth.uid())
                )
              )
              or (
                ls.visibility = 'friends'
                and exists (
                  select 1 from public.follows f1
                  where f1.follower_id = auth.uid() and f1.followed_id = ls.host_user_id
                )
                and exists (
                  select 1 from public.follows f2
                  where f2.follower_id = ls.host_user_id and f2.followed_id = auth.uid()
                )
              )
            )
          )
        )
    )
  );

drop policy if exists "live_events insert authed" on public.live_events;
create policy "live_events insert authed" on public.live_events
  for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

