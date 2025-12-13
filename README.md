# Radio Show

Minimal, arcade-styled web deck that stitches Spotify tracks with your own voice bumpers. Search Spotify, drop songs into a queue, record mic takes in-browser, and roll them back-to-back with fades.

## What you need
- Spotify Premium account.
- Short-lived Spotify OAuth token with scopes: `user-modify-playback-state`, `streaming`, `user-read-playback-state`, `user-library-read`, `playlist-read-private`, `playlist-read-collaborative`, `user-read-private`, `user-read-email`.
- Modern desktop browser with mic access.

## Run it
Static site—no build step required.

```bash
# from repo root
python3 -m http.server 5173
# then open http://localhost:5173
```

## Mobile prototype (React)
A mobile-first React prototype UI lives at `mobile/`:

- `http://localhost:5173/mobile/`

**Important:** Your Spotify app’s Redirect URI must exactly match what you use in the UI. Default is `http://localhost:5173/callback.html` locally or `https://<username>.github.io/radio-show/callback.html` on GitHub Pages. Register the exact URI in the Spotify dashboard.

GitHub Pages example (free HTTPS):
- Enable Pages for this repo (main branch, `/`), then your app is at `https://<username>.github.io/radio-show/`.
- Register `https://<username>.github.io/radio-show/callback.html` as a Redirect URI (recommended), or the root if you prefer. A `callback.html` helper is included.
- In the UI, set Redirect URI to the exact value you registered before clicking **Authorize with Spotify (PKCE)**.

## Drive the deck
1. Paste your Spotify OAuth token, click **Connect Player**, and pick the **Radio Show Deck** device in Spotify.
2. Search for tracks and hit **Add** to drop them into the show.
3. Record voice bumpers in **Voice Bites**, then **Add to Show**.
4. Use fade toggles, per-block volume, start/end trims (sliders + inputs), and audition buttons to shape transitions.
5. Hit **Play Show** to play every block in order with fades.
6. Save your show (full or tracks-only) and load in `listener.html` (same site) to play with cover art and now-playing UI.

### Built-in PKCE auth (no manual token paste)
- Enter your Spotify app **Client ID** (defaults to the bundled demo ID) and your registered **Redirect URI** (default is the current page URL).
- Click **Authorize with Spotify (PKCE)**; you’ll be redirected to Spotify and back with a token prefilled.
- Required scopes: `streaming user-modify-playback-state user-read-playback-state user-library-read playlist-read-private playlist-read-collaborative`.

## Notes
- Playback uses the Web Playback SDK plus `PUT /v1/me/player/play` to your local device ID.
- Voice takes are held in memory; reload to clear them.
- Sharing/export not wired yet—focus is a personal live radio flow for now.
- Per-track metadata (BPM, key, energy) is fetched via `GET /v1/audio-features` when available.
- Theme dots in the header let you swap color palettes live.
- Save/Load: export full shows (with voice clips or uploads embedded as data URLs) or tracks only; load JSON back in. Auto-saves metadata to localStorage.
- Listener view can pull curated sessions from `sessions/top-sessions.json` (static, same-origin) and features a bottom progress bar with seeking.

## Supabase + profiles (scaffolded)
- In the **Connect** panel, add your `Supabase URL` and `anon/public key` (stored in localStorage). A new **Publish to Supabase** button will send the full show JSON to an Edge Function named `create_session`.
- For this hosted project, Supabase URL + anon key are baked in (`jduyihzjqpcczekhorrq`), so you don’t need to paste keys; they’re loaded automatically.
- Spotify PKCE now requests `user-read-private` + `user-read-email`; after auth the app pulls your Spotify profile, shows your avatar/name in the header, and defaults the Host field. A `sync_spotify_profile` Edge Function is invoked when available.
- Builder includes a **Sessions** panel that lists all Supabase sessions with search and sort. Click **Load** to pull a session back into the builder.
- Listener view uses a `list_sessions` Edge Function if Supabase is configured (falls back to `sessions/top-sessions.json`). Clicking a row will call `get_session` (when available) or fetch the provided JSON URL; Supabase Storage origins are allowed.
- Suggested tables: `profiles` (user_id PK, display_name, avatar_url), `spotify_profiles` (user_id FK, spotify_id, display_name, avatar_url, email, country, product, last_sync_at), `sessions` (id/slug, title, host_user_id, host_name, genre, tags jsonb, duration_ms, track_count, cover_url, visibility, version, created_at, updated_at), `session_assets` (session_id, type, path, duration_ms), `session_stats` (session_id, plays, downloads, likes, last_played_at).
- Suggested Edge Functions: `create_session` (auth required; accepts full show payload, uploads JSON/assets, returns slug/json_url), `list_sessions` (public; search/filter/sort), `get_session` (public; returns metadata + signed asset/JSON URLs), `record_event` (public; increments plays/downloads/likes), `sync_spotify_profile` (auth; upserts profile + spotify_profiles).
- See `supabase/README.md` and `supabase/schema.sql` for the deployable schema and function setup.
