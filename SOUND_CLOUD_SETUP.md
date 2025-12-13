## SoundCloud integration checklist

- SoundCloud API `client_id` (public)  
  - Add it in the Auth Panel “SoundCloud client ID” field; it’s stored in `localStorage` under `rs_sc_client_id`.
- Ensure the tracks you expect are streamable via API (check `media.transcodings` in responses). Some tracks are not streamable or region-limited.
- No secret/refresh token needed for public search/stream endpoints used here.
- To pull your liked tracks, authorize SoundCloud in the Auth Panel (implicit OAuth); the app stores the returned `access_token` in `sessionStorage` only.
- Playback uses the returned HLS/progressive stream URL in an `<audio>` element, so it works on mobile web after a user gesture.
- Rate limits apply; keep the `client_id` private if possible (serve from your backend or rotate if needed).
