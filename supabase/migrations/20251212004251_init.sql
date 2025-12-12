-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key,
  display_name text,
  avatar_url text,
  handle text unique,
  bio text,
  created_at timestamptz default now()
);

create table if not exists public.spotify_profiles (
  user_id uuid references public.profiles (user_id) on delete cascade,
  spotify_id text unique,
  display_name text,
  avatar_url text,
  email text,
  country text,
  product text,
  last_sync_at timestamptz default now(),
  primary key (user_id)
);

-- Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text,
  host_user_id uuid references public.profiles (user_id),
  host_name text,
  genre text,
  tags jsonb default '[]'::jsonb,
  duration_ms integer,
  track_count integer,
  cover_url text,
  visibility text default 'public',
  version integer default 1,
  storage_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assets
create table if not exists public.session_assets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions (id) on delete cascade,
  type text check (type in ('voice', 'upload')),
  path text,
  duration_ms integer,
  created_at timestamptz default now()
);

-- Stats
create table if not exists public.session_stats (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  plays integer default 0,
  downloads integer default 0,
  likes integer default 0,
  last_played_at timestamptz
);

-- Increment helper
create or replace function public.increment_session_stats(
  session_id uuid,
  inc_plays integer default 0,
  inc_downloads integer default 0,
  inc_likes integer default 0
) returns void as $$
begin
  insert into public.session_stats (session_id, plays, downloads, likes, last_played_at)
  values (session_id, inc_plays, inc_downloads, inc_likes, case when inc_plays > 0 then now() else null end)
  on conflict (session_id) do update
    set plays = public.session_stats.plays + inc_plays,
        downloads = public.session_stats.downloads + inc_downloads,
        likes = public.session_stats.likes + inc_likes,
        last_played_at = case when inc_plays > 0 then now() else public.session_stats.last_played_at end;
end;
$$ language plpgsql;

-- Updated at trigger
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sessions_touch_updated_at on public.sessions;
create trigger sessions_touch_updated_at before update on public.sessions
for each row execute procedure public.touch_updated_at();

-- Indexes
create index if not exists sessions_slug_idx on public.sessions (slug);
create index if not exists sessions_created_idx on public.sessions (created_at);
create index if not exists sessions_visibility_idx on public.sessions (visibility);
create index if not exists sessions_tags_gin on public.sessions using gin (tags);
create index if not exists sessions_search_idx on public.sessions using gin (
  to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(host_name, '') || ' ' ||
    coalesce(genre, '') || ' ' ||
    coalesce(tags::text, '')
  )
);

-- RLS (keep permissive for testing; tighten in prod)
alter table public.profiles enable row level security;
alter table public.spotify_profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.session_assets enable row level security;
alter table public.session_stats enable row level security;

-- Profiles: users can see all, update their own
drop policy if exists "profiles read all" on public.profiles;
create policy "profiles read all" on public.profiles for select using (true);
drop policy if exists "profiles upsert own" on public.profiles;
create policy "profiles upsert own" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Spotify profiles: users can see all, upsert own
drop policy if exists "spotify_profiles read all" on public.spotify_profiles;
create policy "spotify_profiles read all" on public.spotify_profiles for select using (true);
drop policy if exists "spotify_profiles upsert own" on public.spotify_profiles;
create policy "spotify_profiles upsert own" on public.spotify_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sessions: public read, owners write (relaxed if owner null)
drop policy if exists "sessions read public" on public.sessions;
create policy "sessions read public" on public.sessions for select using (visibility = 'public');
drop policy if exists "sessions insert owner" on public.sessions;
create policy "sessions insert owner" on public.sessions for insert with check (auth.role() = 'service_role' or host_user_id is null or auth.uid() = host_user_id);
drop policy if exists "sessions update owner" on public.sessions;
create policy "sessions update owner" on public.sessions for update using (auth.role() = 'service_role' or host_user_id is null or auth.uid() = host_user_id);

-- Assets: public read, owner write
drop policy if exists "session_assets read all" on public.session_assets;
create policy "session_assets read all" on public.session_assets for select using (true);
drop policy if exists "session_assets write owner" on public.session_assets;
create policy "session_assets write owner" on public.session_assets for all using (auth.role() = 'service_role' or exists (select 1 from public.sessions s where s.id = session_id and (s.host_user_id is null or s.host_user_id = auth.uid())));

-- Stats: public read, service writes
drop policy if exists "session_stats read all" on public.session_stats;
create policy "session_stats read all" on public.session_stats for select using (true);
drop policy if exists "session_stats write service" on public.session_stats;
create policy "session_stats write service" on public.session_stats for all using (auth.role() = 'service_role');
