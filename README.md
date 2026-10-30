# Sparky Picture Play — current game snapshot

Serve this repository root over HTTP. The opening loading screen waits for Sparky, the board artwork, font, and the first puzzle. Later puzzle images load on demand, with the next round warmed in the background. Background warming respects the browser’s Save-Data preference.

# Sparky’s Picture Match

A calm landscape matching game for ages 5–6. Three whole picture cards are swapped by dragging or by tapping two cards. Fixed visible targets explain where they belong, so children need not recall alphabet ordering from memory.

- Letters: capital-letter cards match visible capital targets, starting with A–F. After three letter successes, A–Z can appear. After six, capital cards match lowercase targets.
- Counting: groups of familiar objects match numeral targets. Starts within 1–5; increases to 1–7 after four counting successes, then 1–10 after eight. One object type per board keeps the task clear.
- Fresh boards are generated in code and letters/counting are mixed. Ten reusable countable PNGs provide varied quantities without generating new pictures. Three distinct targets guarantee a unique answer. The last twelve board combinations are avoided.
- No addition, subtraction, timers, lost points, top menus or picture dropdowns. The next arrow can skip an unfinished board at any time. Tap Sparky to hear the goal again. Sound, pause, keyboard access and reduced motion are supported.

## Run

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/?v=quiet-meadow-10. A VS Code Live Server URL under `/sparky-picture-play/` also works. Use HTTP rather than file URLs, since the game loads modules and rig data.

## Artwork

Runtime object PNGs: `assets/art/objects/`. Native masters, prompts and independently redrawn replacements: `assets/art/source/learning-png/`. Generated with the built-in ImageGen tool. `output/object-png-audit.png` shows every extracted object for review. The object extraction rejects secondary fragments touching a source-cell boundary. Kite, quilt and van are standalone redraws because their original sheet cells clipped their own edges.

The quiet garden has an unobstructed foreground (`quiet-garden-clear-v2.webp`). The original carnival background and earlier precomposed cards are kept as development history; the current game renders whole individual PNGs directly, never cropped strips.

`puzzle-generator.js` owns age progression, targets and combinations. `game.js` owns interaction and the reusable image cache. `learning-voice.js` uses the device’s English speech voice, so the exact voice and availability depend on the browser/OS. Matching also works without sound. A talking rig action accompanies speech; this is not phoneme-synchronized lip animation. The rig and its license are bundled in `sparky-animations 4/`.

## Rebuild and checks

The current game uses the object PNGs, not a finite board manifest. To re-extract the native PNG masters, run `python3 sparky-picture-play/tools/build-png-learning-cards.py`, then copy `assets/art/source/learning-png/objects/*.png` to `assets/art/objects/`. Earlier board builders are source history and do not control current runtime generation.

```sh
node tests/generator.mjs
node tests/model.mjs
node tests/director.mjs
node tests/audio.mjs
node tests/assets.mjs
```

Generator tests exercise 2,000 boards, unique answers, quantity caps, all ten reusable counting objects, uppercase/lowercase targets and recent-board avoidance. The swap model and rig/audio tests cover interaction logic, action completion and sound lifecycle. These checks do not replace observation with children or prove a universal age suitability.

The learning direction uses concrete quantity matching and gradual difficulty, informed by the [IES early-maths practice guide](https://ies.ed.gov/ncee/WWC/PracticeGuide/18) and [letter-name learning guidance](https://ies.ed.gov/use-work/resource-library/resource/other-resource/supporting-your-childs-reading-home).

## Board presentation

Targets are fixed headings on a pale reference rail and cannot be dragged. Only the lower picture cards move: they have raised edges, grips, keyboard focus and a selected lift. Small green checks indicate a card in its target slot; cards remain swappable until the board is complete. A short entrance lift is disabled for reduced-motion users. The quiet top-level UI keeps only sound, pause, Sparky, earned stars and the always-available next arrow.

## Background audio

Uses the supplied Sunny_Afternoon_Meadow.mp3 at 0.07 music gain, with a gentle 2-second fade-in and 0.018 gain beneath Sparky’s voice. The original source is not modified. Repeated taps do not restart the track or override speech ducking. Sound, pause and hidden-tab behaviour remain.

Ice-cream quality repair: the clipped sheet cell is superseded by an independently generated complete scoop and cone at `assets/art/objects/ice-cream-whole-v2.png`. Native source and exact built-in ImageGen prompt: `assets/art/source/learning-png/single/ice-cream.png` and `ice-cream-prompt.txt`. The runtime uses a new filename to avoid the old cached crop. The extraction pipeline now includes this standalone replacement.
