## SoundCloud integration checklist

- SoundCloud API `client_id` (public)  
  - Add it in the Auth Panel “SoundCloud client ID” field; it’s stored in `localStorage` under `rs_sc_client_id`.
- Ensure the tracks you expect are streamable via API (check `media.transcodings` in responses). Some tracks are not streamable or region-limited.
- No secret/refresh token needed for public search/stream endpoints used here.
- Optional OAuth (implicit) unlocks more tracks; the app stores the returned `access_token` in `localStorage` under `rs_sc_token`.
- Playback uses the returned HLS/progressive stream URL in an `<audio>` element when available.
- If a track is not streamable, the app should deep-link to the SoundCloud app as a fallback (v1 behavior).
- Rate limits apply; keep the `client_id` private if possible (serve from your backend or rotate if needed).
