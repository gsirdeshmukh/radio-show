# Progress Update — Mobile Social + Live Scaffolding

Date: 2025-12-14 (started ~6:54pm ET)

## What shipped (capabilities, not polish)

### Mobile (React prototype)
- Supabase config + email-link auth scaffold in Profile.
- Profile settings: handle + zip + location opt-in (stored locally + synced to Supabase).
- Sessions feed modes: New / Top / Near (zip) / Following / Inbox / Live.
- Follow/unfollow from Sessions; “friends” = mutual follow (enforced server-side for visibility rules).
- Presence badges (green “active”) based on `profile_presence.last_seen_at` (followers/friends only).
- Inbox: view incoming shares; load into Builder.
- Load session JSON via `get_session` → map show segments into the Builder queue.
- Live: list live sessions + “Join” opens a room powered by `live_events` + realtime (chat + voice).
- Live voice (beta): WebRTC mic/audio with signaling via `live_events` (`webrtc_offer`/`webrtc_answer`/`webrtc_ice`); requires user gesture (iOS autoplay-safe) and uses STUN `stun:stun.l.google.com:19302`.

### Web app (index.html + app.js)
- Connect panel: profile handle + zip + location opt-in + follow-by-handle.
- Show Builder: session visibility (public/unlisted/followers/friends) + per-session zip + “Nearby” opt-in.
- Sessions panel: feed selector (Public / Following / Nearby / Inbox / Live).
- Following feed (direct table query w/ RLS), Nearby feed (via `list_sessions` zip filter), Inbox list w/ Load + Mark Read.
- Follow/unfollow + “Send” (creates `inbox_items`) on each session row.
- Presence badges on session rows when visible.
- Live: `Go Live` / `End Live` buttons + Live list + Join opens a room powered by `live_events` + realtime (chat + voice).
- Live voice (beta): WebRTC mic/audio with signaling via `live_events` (`webrtc_offer`/`webrtc_answer`/`webrtc_ice`); requires user gesture and uses STUN `stun:stun.l.google.com:19302`.

### Web listener (listener.html + listener.js)
- Added the same Sessions feeds as the builder: Public / Following / Nearby / Inbox / Live.
- Added Supabase Auth + Profile (handle/zip/opt-in) + Follow-by-handle panel.
- Added presence badges + follow/unfollow + send-to-inbox actions.
- Added Live room panel wired to `live_events` + realtime (chat + voice).
- Live voice (beta): WebRTC mic/audio with signaling via `live_events` (`webrtc_offer`/`webrtc_answer`/`webrtc_ice`); requires user gesture and uses STUN `stun:stun.l.google.com:19302`.

## Backend scaffolding (Supabase)

### Schema + migration
- Added `supabase/migrations/20251214190000_social_live_location.sql`.
- Added `supabase/migrations/20251214203000_live_events_insert_policy.sql` to tighten `live_events` inserts to only allowed viewers.
- Added new tables:
  - `follows` (follower graph; friends = mutual follow)
  - `profile_locations` (zip + opt-in; private by default)
  - `profile_presence` (last-seen + status; visible to self + followers/friends)
  - `session_locations` (zip + opt-in; public only if opted-in)
  - `inbox_items` (direct session shares)
  - `live_sessions` + `live_events` (live discovery + events)
- Updated sessions read policy to support `public`/`unlisted` plus gated `followers`/`friends`.

### Edge Functions
- Updated:
  - `create_session`: clamps visibility + writes `session_locations` when zip present.
  - `list_sessions`: supports `{ zip }` filter + returns `zip` only if opted-in.
  - `get_session`: supports visibility rules + inbox override; now uses auth headers when available.
- Added:
  - `start_live`, `end_live`, `list_live` (discovery + rooms; voice streaming currently via WebRTC P2P on the client).

## Placeholders / TODOs (tracked)

- TODO-LIVE-SCALE-1: Replace P2P WebRTC mesh with an SFU provider (LiveKit/Agora) + Edge Functions to mint join tokens.
- TODO-LIVE-SIGNAL-1: Move WebRTC signaling out of `live_events` into an ephemeral channel (or dedicated table) to avoid DB noise and simplify cleanup.
- TODO-LIVE-SYNC-1: Expand live “show events” (`live_events`) beyond chat (now-playing, reactions, stage/queue); current status: chat + realtime is wired on mobile + web.
- TODO-NEARBY-1: Zip → lat/lng + radius search; decide privacy model (coarse geohash, city-level, etc).
- TODO-PRESENCE-1: Replace heartbeat table writes with Supabase Realtime Presence where possible; keep RLS gating.
- TODO-INBOX-1: Add threads + per-message metadata (session title/cover snapshot) + archive/delete; realtime notifications UX.
- TODO-FOLLOW-1: Profile pages, follower counts, mutual “friend” UI, blocking/reporting primitives.
- TODO-SECURITY-1: Tighten Edge Function auth + rate limits; audit all service-role usage; validate inputs more strictly.
- TODO-WEB-LISTENER-1: Listener parity done; next: polish playback + social UI integration.
