# Garden controls v1

Three main game controls: sound (with muted state), pause and Next.

The two transparent 1254 × 1254 PNG skins were generated with the imagegen skill. Teal matches the illustrated board; the gold variant distinguishes forward navigation. The four SVG glyphs are separate, deterministic artwork so they remain crisp at phone sizes. Main controls retain native HTML buttons, accessible names and a minimum 56 CSS pixel square hit area. The visible artwork has an inset safety margin within that area.

`controls.css` owns backgrounds, glyph sizing, pressed states and keyboard focus. `game.js` switches between sound-on and sound-off SVGs. The pause icon replaces the previous X because the action opens the pause dialog.

Research informing interaction (not a claim that the chosen palette is scientifically optimal):
- Nielsen Norman Group, Design for Kids Based on Their Stage of Physical Development: large noticeable targets and simple gestures. https://www.nngroup.com/articles/children-ux-physical-development/
- W3C, Understanding SC 2.5.5 Target Size: 44 × 44 CSS pixel enhanced target-size guidance. https://www.w3.org/WAI/WCAG21/Understanding/target-size

Verified in the local responsive review: 88/88 layout states across portrait gating, landscape phones, tablet and desktop; sound mute/unmute and pause/resume checked in browser. Build dependency traversal includes PNG skins and both sound glyph states.
