# Sparky as a play companion

This revision replaces the shout-and-random-gesture sequence with responses connected to the current task. On-screen labels remain English; narration is Hindi. The user-requested automatic next puzzle still starts 2.5 seconds after completion; pause/hidden tabs preserve the remaining delay and Next can skip immediately.

## What the character does

| Moment | Rig behavior | Voice |
| --- | --- | --- |
| First board | Faces the child and gives a small wrist/arm wave, then turns attention toward the board | Brief instruction after sound unlock, if the child has not already started solving |
| A picture/number receives touch or keyboard focus | Smooth, bounded pupil movement toward that area | Quiet |
| Child taps an object to count | Small nod; attention follows that row | Existing child-requested Hindi number queue |
| A correct partial match | Small nod instead of unrelated jumping/shouting | Quiet; soft feedback cue and small confetti remain |
| Two mistakes | Guiding arm with a gentle head gesture; existing visual hints | At most one short, actionable coaching line, respecting a 20-second automatic speech gap |
| Child taps Sparky | Guiding gesture; highlight an unfinished row, section or card/letter target as appropriate | Explains the current next step, e.g. “तस्वीरों पर टैप करो। हम एक-एक करके गिनेंगे।” |
| Round completed | One task-appropriate proud/thumbs-up/clapping response; no second random pose | One brief acknowledgment: “अक्षर मिल गए!”, “बिल्कुल सही गिना!”, “तस्वीर तैयार है!”, “सब सही गिना!”, or “तीनों अंतर मिल गए!” |
| Child rests | One subtle head-tilt thinking gesture, without repeated demands | Quiet |

The five game types still come from balanced shuffle bags. Existing picture decks, difficulty limits, quiet background music, optional counting and always-available Next remain in place.

## Actual rig implementation

`companion-pose.js` applies bounded additive changes after the authored pose. It uses the existing `Face`, `Eyeball_L`, `Eyeball_R`, `Hand_Left_IK_Bone2`, and `Palm_R2` bones. Pupil translation is converted from world to parent-local coordinates. The arm follows the original rig's IK constraints. Ease-in/ease-out envelopes return the gesture to its base pose; rapid repeated nod requests do not restart an unfinished nod.

The code never changes the character's scale, camera, feet, meshes, texture, or skeleton source. Reduced-motion preference disables additive motion.

`rig-player.js` now exposes `setPoseModifier` and `setSpeech`. Speech extracts only the original vocal animation's Lips bone timelines and mouth/Mouth_P/Lips/Lips2 slot timelines, including the vocal clip’s command to hide the resting smile. The mouth layer starts and stops with actual device speech events, while other gestures keep playing. This is an articulated speech animation, not phoneme-accurate lip synchronization.

The voice remains the existing device hi-IN speech engine. Help uses rate .94, pitch 1.04, volume .85. Success acknowledgments use rate 1.07, pitch 1.06, volume .8. No actor voice recordings or custom voice model were generated. Voice quality varies by device.

## Research and what it supports

- [Gulz, Londos & Haake, 2020: preschoolers and a teachable early-math agent](https://portal.research.lu.se/en/publications/preschoolers-understanding-of-a-teachable-agent-based-game-in-ear/) studied 36 children aged 4–6. Their gaze behavior suggested that children understood the agent's task role. This motivates making Sparky's role and attention meaningful; it does not prove this implementation improves learning.
- [Schroeder, Davis & Yang: umbrella review](https://journals.sagepub.com/doi/pdf/10.1177/07356331241288476) synthesizes 17 reviews/meta-analyses. It reports small positive effects overall and explicitly says the field cannot yet prescribe the ideal agent for any particular context. This change avoids claiming “perfect” learning or a guaranteed engagement effect.
- [Google: Designing engaging apps for children](https://developers.google.com/building-for-kids/designing-engaging-apps) supports simple interactions, clear multimodal feedback, visual hints, limiting distractions, and testing with children and parents.
- [UNICEF Innocenti RITEC](https://www.unicef.org/innocenti/projects/responsible-innovation-technology-children) informs meaningful mastery, choice and wellbeing rather than pressure-based retention.

Timings and gesture ranges here are engineering/design choices inferred from these principles, not research-established thresholds. No study with children was conducted. The useful next validation is observing 5–6-year-olds: do they understand why Sparky looks/nods/guides, can they request help, and does the speech help without interrupting thought?

## Checks

`tests/companion-rig.mjs` samples the real Spine skeleton across four new gestures and speech, checking finite transforms, bounded eye movement, unchanged bone scales and stationary feet, mouth-only speech effects and reduced-motion behavior. Existing rig blend/attachment tests, timing, pause/mute, generated boards and all game-mode tests pass. Browser review checked fixed wave, guidance and speech poses in companion-review.html, and caught/fixed a waving hand hidden behind the flame. The game also loads with the new companion code. Child playtesting remains outstanding.

Mouth overlap regression: samples speech during idle, thumbs-up and clapping, plus action-to-idle blending. The resting Lips drawing must be hidden whenever the vocal mouth is active, and restored when speech stops.

## Landscape phone fitting

`responsive.css` uses dynamic viewport height and safe-area insets. Portrait shows an English rotate prompt, disables game input and suspends speech, rig playback and auto-advance; rotation resumes the same round. All five modes stay on one landscape screen with no scrolling. `responsive-layout.js` measures the inner board to fit complete comparison photos and the assembly target/tray without changing artwork proportions. Compact counting rounds retain four rows and use up to five objects per row; larger screens retain the existing progression to ten.

Validation: `tests/responsive-layout.mjs` covers artwork bounds and compact counting generation. `responsive-review.html` runs DOM containment and overflow checks for five modes at nine viewport sizes (320×568, 360×640, 390×844, 430×932, 568×320, 844×390, 768×1024, 1024×768, 1440×900). Portrait cases verify the rotate prompt and inactive game. Physical iOS/Android testing is still needed for device-specific browser chrome and speech behavior.


Compact landscape sizing now reserves a 22.5% left lane for Sparky and a separate right lane for controls. Sparky uses a larger 19% canvas container with 1.65 visual scale; sound, pause and next controls grow from 56 to 88 CSS pixels with viewport height. The fitting review also checks the rendered character alpha bounds against the board, controls and viewport, as well as card/tray containment.


Answer-state fitting: counting answer docks now use a measured square constrained by both row height and width. Number art inside docks is absolutely sized, so the image cannot enlarge a grid track after placement. The placement animation approaches 1.0 scale without overshoot; drag ghosts use the actual number artwork bounds. `counting-state-review.html` exercises the real CountingRound with uncounted, counted, partially answered and fully answered boards; the fitting audit checks each answer image against its box and row instead of testing only initial boards. Loading failures and an unrendered mascot now fail the review.
