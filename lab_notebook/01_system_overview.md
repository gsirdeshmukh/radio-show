# System Overview

The Radio Show app is a static, client-side web tool that blends Spotify playback with locally captured audio (voice bumps or uploads) and sequence editing.

Core pieces:
- `index.html` + `app.js`: builder UI for finding Spotify tracks (via the Web API), adding segments (Spotify, mic recordings, uploads), trimming, cueing, splitting, and exporting shows. Uses the Spotify Web Playback SDK for in-browser playback and the Web API for search/recommendations/library pulls.
- `listener.html` + `listener.js`: listener UI to load exported show JSONs, play them back with cover art and a bottom listen bar that supports seeking across the current segment.
- `style.css`: arcade/minimal theme, shared across builder/listener, including the new trim handles and listen bar.
- `sessions/`: static JSON catalog for curated sessions (top list + demo file) served same-origin for safe loading.

Data model:
- Segments are typed (`spotify`, `voice`, `upload`) with timing (start/end/cue), fades, volume, note, and optional album art/URI. Voice/upload blobs are kept in-memory; exports embed them as data URLs.
- Session metadata (title/host/genre/date) persists locally and travels with exports (version 2 payloads).

Auth and security:
- PKCE flow with a default client ID; scopes include playback plus library/playlist reads.
- Tokens live in sessionStorage with a “forget” control; CSP and no-referrer headers are set on all entry points.
- Imports are constrained to same-origin/data URLs to avoid blind fetch risks.
