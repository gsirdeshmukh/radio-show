## Apple Music integration checklist

- Apple developer token (JWT) with Apple Music entitlement  
  - Replace `APPLE_DEV_TOKEN_PLACEHOLDER` in `app.js` with your token.
- Private key, key ID, and team ID used to mint that token (keep private; not committed) — for regenerating the JWT.
- Apple Music catalog track ID to use for the test button  
  - Replace `APPLE_TEST_TRACK` in `app.js` (e.g., `900032829`).
- Ensure the app is served over HTTPS (MusicKit requirement).
- Apple Music user must sign in on first connect; the in-page “Connect Apple Music” handles `authorize()` once the dev token is set.
- Limitations: works for Apple Music subscribers; non-subscribers will get 30s previews; user gesture required to start playback on mobile.
