# Find 3 Differences

Twenty complete storybook picture pairs, forty PNG photos, for the fifth game mode. The original shelf-display drafts were rejected and are not used. Every final photo is a full native imagegen illustration: pirate playroom, garden helper, space explorer, beach adventure, little baker, rainy walk, music time, farm friends, picnic, snow, camping, little artist, birthday, zoo, station, underwater, kite park, treehouse, robot playtime and bedtime.

The first pirate illustration is the style reference for the other originals. Each matching B illustration was edited from its own A picture with three named changes. Original generation prompts, edit prompts, source images and intended changes are preserved under `assets/art/differences/`. Pair review sheets live in `output/differences-review/`. Final PNGs are normalized to 900 × 1200 without cropping the scenes. The active manifest is published only after all twenty pairs are available and visually reviewed.

Three targets per scene are mapped in `regions.json`, including extra hit areas for partially hidden objects such as the train. The child can select either picture. Each unique difference counts once; both pictures get a thin, unfilled gold outline around the found item. Removed items are outlined at their original location. Pictures remain visible; there are no solid green rectangles. A miss costs nothing. Two partial discoveries use the quick confetti/thumbs-up response, and the third finishes with the existing brief celebration. Next is always available.

The twenty boards use a shuffled bag, with no immediate repeat at refill. A/B can also exchange left and right positions. These boards appear among the existing letter, quantity, assembly and tap-counting rounds. Use `?game=differences` for the focused preview.

Visible titles are English, using locally bundled Nunito. The illustrated ribbon says “Find 3 Differences”, while Sparky gives one short Hindi instruction. Longer speech is available only by tapping Sparky. Pause, mute, hidden tabs, reduced motion, keyboard buttons and stale-round cleanup follow the shared game lifecycle.

Build: `python3 tools/build-story-differences.py` packages candidate art and review sheets; `--publish` writes the live manifest after visual review. Native generated originals remain preserved. Hotspot data describes designed semantic differences; image-edit output can contain small incidental texture variations, which are not additional puzzle targets.

Tests: `node tests/differences.mjs` verifies unique discoveries, either-side behavior, A/B swapping, transparent outlines, multiple hit areas, pause, completion and cleanup. `node tests/round-banner.mjs` checks English titles, brief Hindi speech and popup timing. Existing counting and assembly tests remain applicable.
