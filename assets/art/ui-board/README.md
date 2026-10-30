# Illustrated board assets

Generated individually with the built-in imagegen tool. Exact generation and card correction prompts are in prompts.json; full-size inputs/outputs are preserved under source/.

- board-shell.png: main teal-rimmed ivory board, used in every round.
- target-pad.png: sage play mat under the assembly silhouette.
- piece-tray.png: tall mint tray behind the three loose pieces.
- picture-card-v2.png: corrected opaque white card with yellow and teal rim. Uses nine-slice border-image scaling for both portrait learning cards and wide assembly pieces.

The original picture-card.png is an unused rejected draft; the game uses picture-card-v2.png. CSS positions the assets and supplies focus, selection, hint and match feedback. The visible title and score widgets were removed; screen-reader progress is retained.

- round-ribbon.png: generated purple/lilac title ribbon with a cream-gold edge. It is reused with crisp localized text across all four game types. Native output: source/round-ribbon.png. Exact built-in imagegen prompt: round-ribbon-prompt.txt.
