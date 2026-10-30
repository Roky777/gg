# Tap-to-count and number matching

A fourth round type mixed into the existing game. `?game=counting` previews only this mode. The twenty counting PNGs were generated individually with the built-in imagegen tool; exact prompts and native outputs are in `assets/art/counting/`.

Each board has four different objects, four different quantities, and four shuffled number answers. Initial boards use quantities 1–5; after three successful counting boards the range becomes 1–8, then 1–10 after six. Object choices, quantities, row order and number order vary. The generator avoids the recent board IDs. This produces many combinations, rather than forty fixed boards or a claim of infinitely many unique puzzles.

Counting is optional. Tapping any object gives it the next ordinal within its own row and speaks that ordinal in Hindi. Repeated taps replay that object's original ordinal; they never increment the row count. Other rows keep independent counts. A number can be selected and placed in an answer slot, or dragged onto its row, without counting any objects first. Correct answers lock; wrong answers remain available. There is no timer, lost score or counting prerequisite.

Only child-requested counting enters the short speech queue. Switching counted rows, navigating, pausing, hiding the tab, muting or completing a correct answer cancels pending speech. Number words are spoken at rate 1.05; background music remains ducked until the last queued number finishes. Hindi pronunciation depends on the device's available Hindi voice.

The mode reuses the illustrated PNG board, row cards, mint answer slots and number tray. It adds no title or score counter. Sparky gives the existing quick thumbs-up/confetti reaction after correct partial matches and the short completion celebration, with no forced wait.

Validation:

- `node tests/counting.mjs`: 1,500 generated boards; twenty assets; unique, matching number sets; adaptive limits; visible per-object ordinals; duplicate taps; independent rows; optional counting; direct answers; pause and cleanup.
- `node tests/counting-voice.mjs`: ordered Hindi counting queue, music ducking lifecycle, cancellation and mute.
- `python3 tools/build-counting-art.py`: checks transparent native margins, packages padded 512 × 512 PNGs and produces `output/counting-assets-review.jpg`. It enables the ready manifest only after all twenty images exist.

## Round ribbon

Each new board shows the generated purple PNG ribbon with “Count and Match”; Sparky says “गिनकर सही नंबर लगाओ।” once for that round. The ribbon dismisses in 1.7 seconds, or immediately for a correct match, pause or navigation. Its pointer events are disabled so it never gates the board. Long explanations still require tapping Sparky.
