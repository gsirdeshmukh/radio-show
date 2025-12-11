# Radio Show

Minimal, arcade-styled web deck that stitches Spotify tracks with your own voice bumpers. Search Spotify, drop songs into a queue, record mic takes in-browser, and roll them back-to-back with fades.

## What you need
- Spotify Premium account.
- Short-lived Spotify OAuth token with scopes: `user-modify-playback-state`, `streaming`, `user-read-playback-state`, `user-library-read`, `playlist-read-private`, `playlist-read-collaborative`.
- Modern desktop browser with mic access.

## Run it
Static site—no build step required.

```bash
# from repo root
python3 -m http.server 5173
# then open http://localhost:5173
```

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
