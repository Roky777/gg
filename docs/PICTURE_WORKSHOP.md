# Picture workshop

A randomly mixed third round type alongside letter and quantity matching. The first round opens the new game; afterwards it appears between learning boards. `?game=assembly` is a focused preview of just the new game.

Each picture is assembled from three horizontal sections of one transparent PNG. Source thumbnails and target sections use the same source and exact crop coordinates; pieces are never redrawn independently. No rotations or tiny targets. Tap a piece and a slot, or drag a piece onto its slot. Correct pieces stay in place. Two missed placements highlight the matching slot, without penalties. Keyboard users can select with Enter/Space, press Left to reach the slots, and move between them with Up/Down.

Forty distinct pictures run through a shuffled bag: every picture appears once before the bag refills, with no immediate repeat across bag boundaries. Letters and counting retain their existing progression. An illustrated purple ribbon introduces every new board with a short English title and one short spoken instruction. It slides away after 1.7 seconds and never blocks play. On the first load, speech waits for a real user gesture. Routine card selections, missed placements, progress and completion stay quiet. Tapping Sparky replays the full explanation or completed-picture fact. Sound, pause, next, hidden-tab handling and reduced motion apply to the new game too.

Sparky's reactions follow events: a quick thumbs-up with a small confetti burst for a correct partial match, then a brief clapping/hurray/cheering reaction on completion. Reactions start immediately instead of waiting in the action queue, last at most 0.7 seconds for partial matches or 0.95 seconds for completion, and preserve paused rig time. Confetti clears within 0.85 seconds. Next remains available throughout. Idle help is visual only. No eating, brushing or running actions are used as unrelated reactions.

## Artwork and storage

The built-in imagegen tool generated each illustration separately. Full prompts are in `assets/art/assembly/prompts.json`. Art direction: transparent background, generous margins, rounded friendly shapes, cheerful colour, restrained shading and crisp dark contours. Packing crops transparent margins and downsizes with Lanczos; it does not paint missing art or blur outlines.

The internal disk ran out of space. At the user's request, full-size sources are on `/Volumes/ROKYSM/Sparky-Artwork/assembly/source`; a game-ready backup is on `/Volumes/ROKYSM/Sparky-Artwork/game-assets/assembly`. After moving the project's reproducible temporary animation dependencies to the drive, enough internal space was available to keep a small, real `assets/art/assembly` directory in the project. The game can run without the pendrive; rebuilding artwork requires its full-size sources. No game asset path is an absolute symlink.

`python3 tools/build-assembly-art.py` rebuilds the 768 × 768 PNGs from sources and writes a contact sheet in `output/assembly-contact-sheet.jpg`. It publishes the ready manifest only once all forty images exist and pass transparency/margin checks. Without the manifest, existing letter and number boards remain playable.

## Validation

- `node tests/assembly.mjs`: forty-image bags, no boundary repeats, exact slot logic, hints, tap/drag placement, pause and cleanup.
- `node tests/generator.mjs`: existing 2,000 generated letter/number boards.
- `node tests/director.mjs`: rig clip existence, transitions, pause and reduced motion.
- `node tests/hindi-narration.mjs` and `node tests/audio.mjs`: Hindi voice selection, cancellation, mute and music ducking.

Automated checks are supplemented by the image contact sheet and the running local browser preview. These checks do not replace observing children use the game.
