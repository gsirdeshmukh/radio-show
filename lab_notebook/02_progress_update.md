# Progress Update — Trim & Talk-Over UX

Date: now

What changed:
- Built a slim draggable trim bar per segment with start/end handles, a cue marker, and click-to-scrub auditioning. Shift-click sets start, alt/⌘-click sets end, and cue clicks audition from that spot.
- Added per-segment actions: cue play, “Play From Here” (start full show at this segment), split at cue (inherits fades), and a talk-over button with 30% ducking.
- Keyboard shortcuts: ⌘+Space toggles talk-over on the focused segment; “s” splits at the cue. Segments focus on click for shortcut targeting.
- Talk-over flow records the mic while ducking Spotify to 30%, then inserts the host clip after the track and restores volume.
- Talk-over revised: live overlay monitoring while Spotify plays ducked, and the recorded mic is stored as an overlay on the track with an offset so playback replays both concurrently with ducking. Split feature removed to keep flow simple.
- Styling updated for thin/flat handles and focus outlines; session exports stay at version 2 with cue metadata.
- Persistence fixes: voice bumpers and uploads are now serialized to data URLs for localStorage + exported show files, and hydrated on load so they remain playable after reload/import.
- Playback fixes: “Play Show” works again (no stray click event index), trims respected when starting mid-show, and Spotify/talk-over overlays stop on segment end. Talk-over overlay offset now aligns with trimmed start so recorded host clips actually play back.

### Bug fix — Voice bumpers not reloading
Problem: Saved shows were storing mic clips/uploads with `blob:` URLs (e.g., `blob:https://...`) that are only valid for the tab that created them. Reloading/importing those files left voice segments without accessible audio, so they never played when running “Play Show.”
Fix: Added an `inlineAudioUrl` helper that converts any voice/upload/overlay audio to a portable data URL during export and local persistence. Imports now hydrate those URLs back into playable blobs, so voice bumpers survive reloads and imports.
Impact: Re-export shows to embed audio; old JSON files containing `blob:` URLs cannot be recovered because they never contained audio data. Fresh exports keep voice messages working across refreshes and share/download flows.

### Plan — Mobile native wrapper for playback/recording
Goal: Make the app usable on phones despite Web Playback SDK limits by wrapping the UI and delegating playback/recording to native SDKs.
Approach (lightest path): Capacitor or React Native/Expo shell with a webview for most UI, plus native modules for Spotify and mic.
Steps:
1) Project scaffold: choose stack (Capacitor or RN/Expo), create app, configure bundle ids, signing, and deep-link scheme.
2) Spotify mobile SDK: register app with Spotify, set redirect URI(s), integrate iOS/Android SDKs, implement auth flow, token exchange, and playback control bridge (play/pause/seek/set volume).
3) Bridge layer: expose native playback/mic to JS (e.g., Capacitor plugin or RN module); map existing web player calls to the native API; feature-flag mobile to bypass Web Playback SDK.
4) Recording: wire mic capture via native audio APIs; return blobs/URIs to JS; ensure trimming/cue logic still works; handle permissions UX.
5) Packaging/testing: run on real devices (iOS + Android), verify Spotify Connect visibility, voice overlays, and import/export flows; handle background audio and interruptions.
6) Store readiness (optional): icons/splash, privacy strings, entitlement checks, and app review considerations for Spotify SDK usage.

Notes:
- Spotify tracks still respect SDK limits (no tempo/pitch changes). Uploads/voice continue to use Web Audio; imports remain same-origin/data-URL only.
- PKCE flow uses the GitHub Pages redirect (`https://gsirdeshmukh.github.io/radio-show/`), requests playback + library/playlist scopes, auto-connects the player after token exchange, and CSP now allows the Spotify SDK iframe/connect endpoints. Use “Forget Token” to clear old scopes and re-auth if you see “invalid token scopes.”
