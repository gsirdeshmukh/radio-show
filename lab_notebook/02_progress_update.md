# Progress Update — Trim & Talk-Over UX

Date: now

What changed:
- Built a slim draggable trim bar per segment with start/end handles, a cue marker, and click-to-scrub auditioning. Shift-click sets start, alt/⌘-click sets end, and cue clicks audition from that spot.
- Added per-segment actions: cue play, “Play From Here” (start full show at this segment), split at cue (inherits fades), and a talk-over button with 30% ducking.
- Keyboard shortcuts: ⌘+Space toggles talk-over on the focused segment; “s” splits at the cue. Segments focus on click for shortcut targeting.
- Talk-over flow records the mic while ducking Spotify to 30%, then inserts the host clip after the track and restores volume.
- Styling updated for thin/flat handles and focus outlines; session exports stay at version 2 with cue metadata.

Notes:
- Spotify tracks still respect SDK limits (no tempo/pitch changes). Uploads/voice continue to use Web Audio; imports remain same-origin/data-URL only.
