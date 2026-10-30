# Short play breaks

After four completed learning boards, the next transition offers Balloon Pop. After four more completions, Jelly Wiggle appears. The games alternate. Skipped learning boards do not count toward a break; skipping a break does not schedule it again. Learning progress and difficulty remain separate from play breaks.

Both rounds use six large tap targets, existing teal/cream board artwork, English screen instructions, gentle sound effects, and Sparky's gaze and gestures. Balloon Pop reuses the existing isolated balloon PNG with colour variants. Jelly Wiggle uses the new transparent `assets/art/fun/jelly.png` generated with imagegen, without a plate so its squash/stretch animation reads as jelly.

Play ends after all six objects have been tapped at least once or 12 seconds of active play. Jellies can be tapped repeatedly. There is no failure state, countdown pressure, or required count. A 1.5-second celebration allows the short supplied acknowledgment to finish before returning to a learning board. Next is always available.

Pause dialogs, hidden tabs and portrait rotation suspend the active-time clock. Reduced-motion mode disables bobbing, wobble and particles. Destroying a round cancels its animation frame and prevents stale auto-next callbacks.

Preview routes (then return to the normal learning deck):
- `index.html?game=balloon-pop`
- `index.html?game=jelly-wiggle`

Verification:
- `node sparky-picture-play/tests/play-breaks.mjs`
- `node sparky-picture-play/tests/game-contract.mjs`
- `node sparky-picture-play/tests/audio.mjs`
- `responsive-review.html` includes both play rounds and checks all object hit targets and board containment.
