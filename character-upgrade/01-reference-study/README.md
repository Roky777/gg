# Sparky upgrade — stage 01 reference study

Open `index.html` through the existing local game server:
http://127.0.0.1:4173/character-upgrade/01-reference-study/index.html

This stage inspects and documents the target. It does not modify the shipped
character, fit a replacement rig, or certify a 95% match. Previous experiments
in `character-reference/` are not the baseline for this upgrade.

## Preserved baseline

`baseline/` holds copies of the current game's skeleton, atlas, texture, manifest,
renderer and license. `audit.json` records SHA-256 hashes and source paths.
`node audit.mjs` independently reads the two binary rigs with the bundled runtime
and verifies that the source working pack still matches the preserved copies.
It refuses to overwrite a differing baseline.

The existing voice recordings, mouth timing, mascot director, game logic and
runtime remain in place. They are reuse dependencies, not rewritten in this stage.

## Reusable target sources

- `Sparky_Idle_EB_4_Keys.png`: original four-state source sheet, 1024×1280.
- `animation/sparky/godot-idle-blink/`: source-derived fixed body/head, four eye
  patches and idle/blink playback. Useful as a visual identity control.
- `animation/sparky/godot-parts/`: 31 separate transparent atlas regions,
  26-bone cutout construction and 25 slots, plus four eye states.
- `parts-manifest.json`: exact source rectangles for every part.
- `scripts/build-sparky-parts-rig.py`: source anchors and cutout skeleton builder.
- `animation/icecream/Lucas_Activity_Icecream.*`: original Lucas texture and
  skeleton for joint, alternate-attachment, mask and constraint inspection.

The study copies only reference images/metadata into `source/`; existing source
resources are preserved. No new character artwork was generated.

## Measured target

Coordinates use the original 512×640 source canvas, with Y down. The visible
source-derived assembled pose occupies x=138..374 and y=191..594: 236×403 pixels.
The head extends to y=402, approximately 52.4% of visible height. Eye anchors are
(218,349) and (299,349), separated by 81 source pixels. Foot origin is (256,594).

Joint points are the existing source cutout rig's registration anchors. They are
not claimed to be final anatomical pivots. Elbow, wrist, knee and ankle placement
must be evaluated through bending/contact tests before reuse.

## Aligned comparison

The current game binary is rendered at Idle_EB, time zero, using its own renderer.
The study finds visible bounds at alpha > 200, then uniformly scales the current
actor to 500 pixels high. The target is uniformly scaled to the same height;
both are centred at x=240 with foot baseline y=580 on a 480×620 canvas.
No independent width adjustment, head/body fitting or pose warping is applied.
The blend slider exposes differing silhouettes and feature placement.

This normalization compares proportions; it does not compare in-game camera size.
The current rendered bounds include the renderer's antialiasing threshold, while
source target bounds come from the original transparent reference. No aggregate
similarity percentage is computed from this presentation.

## Inspection findings / next-stage brief

1. Match the complete neutral sports character first. The current face, open-eye
   shape, glove silhouette, shirt/collar, badge, shorts and footwear differ.
2. Keep the existing 60-clip motion library and useful controls. Both inspected
   rigs contain 201 bones, 113 slots, 91 meshes (65 weighted), 20 IK constraints,
   12 transform constraints and six clipping attachments. Equal counts do not
   mean their images or every setup transform are identical.
3. Reuse the original target parts to establish appearance and registration.
   The 26-bone cutout rig is not a drop-in substitute for the 201-bone game rig.
4. Refit attachment geometry, necessary setup pivots and weights; preserve
   constraint dependencies and verify draw order. Do not stretch target pixels
   across unsuitable Lucas silhouettes or apply per-frame size correction.
5. Keep external alpha contours sharp. Use matching paint and limited feathering
   only on concealed joint overlaps. Original source-painted overlap caps are
   useful starting points, not proof of coverage through extreme bends.
6. Alternate hands, mouth shapes, props and unseen orientations need additional
   matching artwork or adaptation. The neutral reference does not provide them.
7. Facial slots must preserve the game's single-mouth speech contract.

## Limits and acceptance

The available visible actor is 236×403 at native resolution. It is not genuine
full-HD source art. The extracted clean face contains reconstructed hidden paint;
side/back views and alternate gesture hands are absent. A high-resolution redraw,
if needed later, must be judged against these locked identity/proportion guides.

The 95% similarity request remains a target. Acceptance should combine aligned
silhouette/landmark comparisons, colour and detail review, and human visual review.
It cannot be established by parser checks or a single arbitrary image score.
Before game replacement, inspect all game-used motions, speech/expressions,
transitions and prop contacts for jitter, unintended scale changes and joint gaps.
