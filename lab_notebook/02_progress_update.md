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

Notes:
- Spotify tracks still respect SDK limits (no tempo/pitch changes). Uploads/voice continue to use Web Audio; imports remain same-origin/data-URL only.
- PKCE flow uses the GitHub Pages redirect (`https://gsirdeshmukh.github.io/radio-show/`), requests playback + library/playlist scopes, auto-connects the player after token exchange, and CSP now allows the Spotify SDK iframe/connect endpoints. Use “Forget Token” to clear old scopes and re-auth if you see “invalid token scopes.”
