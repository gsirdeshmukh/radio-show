# Supabase backend scaffold

This repo expects a Supabase project with Storage buckets and Edge Functions. Keep secrets out of git; configure everything in the Supabase dashboard or with the CLI.

## Buckets (public)
- `sessions` — canonical JSON for each session (e.g., `sessions/{uuid}.json`).
- `assets` — optional audio assets (voice/upload) if you choose to offload blobs.

## Env vars for Edge Functions
- `PROJECT_URL` — your project URL (fallback env name that bypasses the SUPABASE_ prefix restriction).
- `SERVICE_ROLE_KEY` — service role key (secure; functions need this for RLS bypass).
- `SESSION_BUCKET` — defaults to `sessions`.
- `ASSET_BUCKET` — defaults to `assets`.
- Optional: `ALLOW_ANON_CREATE` (`true` to let unauthenticated calls create sessions; otherwise requires a Supabase auth JWT).
- `SUPABASE_JWT_SECRET` (required for Clerk exchange)
- `CLERK_JWKS_URL` (optional; defaults to `https://api.clerk.com/v1/jwks`)
- `CLERK_ISSUER` (optional; if set, Clerk JWT `iss` must match)

## Deploying functions
From repo root (with Supabase CLI installed and logged in):
```bash
supabase functions deploy create_session
supabase functions deploy list_sessions
supabase functions deploy get_session
supabase functions deploy record_event
supabase functions deploy sync_spotify_profile
supabase functions deploy clerk_exchange
supabase functions deploy start_live
supabase functions deploy end_live
supabase functions deploy list_live
```
These functions are intended to be callable from the public frontend. Ensure JWT verification is disabled when deploying (either keep `verify_jwt = false` in each `supabase/functions/*/config.toml` or pass `--no-verify-jwt` to `supabase functions deploy`).

## Database schema
Apply `supabase/schema.sql` in the SQL editor or `supabase db push`.

Key tables:
- `profiles` — user profile row keyed by Supabase auth `user_id`.
- `spotify_profiles` — snapshot of Spotify `/me`.
- `follows` — follower graph (friends = mutual follow).
- `sessions` — metadata + storage pointer to session JSON.
- `session_locations` — optional per-session zip (public only if opted-in).
- `session_assets` — optional stored audio asset rows.
- `session_stats` — counters (plays/downloads/likes).
- `profile_locations` — per-user zip (private by default).
- `profile_presence` — last-seen (visible to self + followers/friends).
- `inbox_items` — direct session shares (sender/receiver only).
- `live_sessions` — live session discovery + lifecycle (streaming provider is a placeholder).
- `live_events` — event stream for live sessions (chat/now-playing/etc; scaffolding).

## Frontend configuration
- In the builder Connect panel, paste `Supabase URL` + `anon/public key` (stored in localStorage).
- The builder calls Edge Functions by name (e.g., `create_session`, `sync_spotify_profile`).
- Listener uses `list_sessions`/`get_session` when Supabase is configured; otherwise falls back to `sessions/top-sessions.json`.

## Minimal auth story
Edge Functions accept the caller’s `Authorization` header. If you want uploads gated, set `ALLOW_ANON_CREATE` to `false` and require a Supabase-authenticated JWT in the frontend before invoking functions. For fast testing, leave it `true` but enable rate limits.

## Clerk exchange
The `clerk_exchange` function verifies a Clerk session token, derives a stable UUID for the user, upserts the profile, and returns a Supabase JWT compatible with RLS. The frontend then uses that JWT for profile, follow, and inbox operations.
