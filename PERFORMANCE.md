# Optimized game build

The standalone output is `game-build-optimized/` at the workspace root. Run
`tools/build-game.mjs` with Node to rebuild it from the game project. It is a
static site: no backend, package installation or runtime CDN is required.

## Changes

- Converted 369 PNG assets from 188,584,062 bytes to 38,558,638 bytes. Character
  atlas textures use lossless WebP with unchanged dimensions and atlas geometry.
  Other illustrations use WebP quality 94. Original PNG sources remain local.
- The shared character render buffer follows visible display size, bounded to
  384–768 pixels wide. It previously allocated 512–1024 pixels wide.
- Reuse the normal HTTP cache for the rig manifest. Runtime textures are local.
- Keep at most 24 recently decoded picture images in the game's explicit cache.
- Delay the legacy food sheet until an action actually needs it.
- Opening preload now requests the current background and current UI artwork,
  rather than old, overridden shells and counting materials.
- Corrected four encoding-damaged recording folder names. All 165 supplied
  recording paths are now resolvable. Missing dialogue stays silent; there is no
  browser-generated speech.
- The build excludes authoring mesh JSON, original PNGs that have runtime WebP
  copies, source artwork, old Figma background plates and review captures.

WebP encoding used Google's [cwebp utility](https://developers.google.com/speed/webp/docs/cwebp).

## Measurements

Cold-cache, local Chromium review at 1280×720; transfers include the resources
requested during the initial measurement window.

| Opening board | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Picture ordering | 21,616,389 bytes | 15,342,899 bytes | 29% |
| Feeding | 27,530,375 bytes | 16,039,251 bytes | 42% |

In the four-second frame sample, ordering produced 150 frames before and 156
after; feeding produced 182 before and 196 after. Both retained a 33.4 ms 95th
percentile interval in this software-rendered review browser. This is a measured
improvement, not a claim of 60 FPS on every device. GPU-backed physical-device
testing remains useful.

Verification covers all 12 active boards, playlist wrap, scene cleanup, narrow
landscape layouts, feeding input, recorded-only narration and recording paths.
The exported build was served independently of the source directory.
