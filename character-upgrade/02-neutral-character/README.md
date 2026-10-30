# Stage 02 — source-matched neutral Sparky

Preview: http://127.0.0.1:4173/character-upgrade/02-neutral-character/index.html

## Deliverables

- `Sparky-Neutral.png`: transparent assembled character on the original 512×640 canvas.
- `Sparky-Neutral-Cropped.png`: transparent 236×403 visible character.
- `parts/`: 31 separate transparent native-size PNGs, including alternate eye states.
- `Sparky_Neutral_Parts.png` and `.atlas`: 512×512 straight-alpha atlas, with two-pixel gutters.
- `Sparky_Neutral_Setup.json`: editable Spine 4.2 neutral setup with the existing source-part anchors. No adapted animations are included.
- `parts-manifest.json`: source coordinates, atlas registration, anchors and neutral draw order.
- `Target-Source.png`: original source-sheet top-left pose, used for the comparison.
- `validation.json`: measured comparison, source hash, atlas checks and limitations.

## What changed

Reuse comes from `animation/sparky/godot-parts/`, based on
`Sparky_Idle_EB_4_Keys.png`. Thirty of the 31 parts are byte-for-byte unchanged.
The existing extracted Face had reconstructed gold paint visible beyond the
facial contours. Stage 02 restores original source gold wherever no feature
attachment occupies the pixel. It retains the existing clean reconstructed paint
underneath independent brows, eyes, nose and smile. The old eye/mouth drawings
are not painted into the background face.

The original source canvas, part sizes and positions are retained. No part is
resized, warped or stretched over the Lucas geometry. No exterior blur or new
feathering is applied. Existing five-row source-painted overlap caps remain
beneath proximal limb joins. Their coverage during bends is not certified here.

## Verification

Run `python3 build.py` from this directory or its absolute path. Pillow and NumPy
are used for deterministic source-layer assembly, packing and comparison, not
for a procedural redraw. The script checks every packed region against its PNG.
It asserts that exterior alpha is identical to the source and that maximum RGB
and alpha differences do not exceed 3/255 at native registration.

The reconstructed face previously produced differences as large as 94/255 in
the assembled image. The corrected neutral assembly differs by at most 3/255,
from alpha-over compositing of slightly translucent source features over their
clean background. This is not a claim of exact RGBA identity or an overall
similarity score. Native source pixels are shown enlarged in close-ups without
claiming a full-HD redraw.

The user-facing preview contains light/dark views, a registered source overlay,
face/cuff/footwear close-ups, an exploded-layer inspection slider and PNG links.

## Remaining stages

Only neutral appearance is prepared. Do not replace the working game rig with
this 26-bone source setup. Retain the 60-clip game rig and useful controls for
stage 03 fitting. Alternate gestures, expressive eyes, mouth visemes, draw order,
mesh topology, weight painting, extreme bends and prop contacts need separate
adaptation and validation. The source is front-facing and supplies no side/back
art or alternate hand gestures. The main game and working asset pack are unchanged.
