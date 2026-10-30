# Sparky response variety

Updated 29 October 2026.

## Research and design decisions

Nielsen Norman Group's research with children aged 3–12 recommends clear, specific goals and age-appropriate audio/visual instructions, with examples understood by six-year-olds:
https://www.nngroup.com/articles/kids-cognition/

UNICEF Innocenti's RITEC research connects supportive digital play with children's control, choice, mastery, achievement and relationships:
https://www.unicef.org/innocenti/projects/responsible-innovation-technology-children

Our implementation applies those principles by retaining explicit first-use instructions and child-requested help, while allowing uninterrupted solving. The exact shuffle pools and timings below are product design decisions, not findings established by those studies. Enjoyment and comprehension still need observation with children aged 5–6.

## Runtime behavior

- Wave once per session. Later boards alternate a brief presentation, thoughtful head tilt, nod and quiet attention toward the puzzle. A shuffled bag avoids consecutive repeats and includes quiet arrivals.
- Explain each mechanic once per session after audio unlock. Starting to solve cancels a pending explanation. Do not replay instructions every fourth visit.
- Tap Sparky for contextual visual help and one of two supplied help recordings for that mechanic. A second mistake can offer help, subject to the existing speech cooldown.
- Intermediate matches receive a quiet nod, small thoughtful motion or attentive look, with the existing visual confirmation. Do not announce every match.
- Completed boards rotate thumbs-up, proud acknowledgment, clapping, cheering and hurray. Only one action is requested for the completion.
- Each mechanic has two distinct supplied win MP3s, interleaved with the short approved recordings `small_success_03` (Yes!) and `small_success_04` (Mil gaya!). Selection remembers the previous wins across game types so a shared clip cannot repeat on consecutive completions. Bags survive board changes.
- Audio introductions do not restart an arrival gesture. Requested help has a separate small gesture pool. Counting retains its audio-clock-timed nods and native visemes.
- Keep natural recorded pitch and speed. No new recordings or synthetic substitutes are required for these variants.
- Automatic Next waits at least 2.5 seconds and, for longer selected recordings, until that actual MP3 duration plus 320 ms. Manual Next remains immediate. Pause, mute, rotation and navigation keep their existing cancellation behavior.

## Verification

`node sparky-picture-play/tests/play-flow.mjs` exercises 100 completions across all five mechanics using the real recording catalog. It checks consecutive MP3 repeat protection, selected-recording duration, all celebration choices, first-use instructions and arrival variety, as well as manual skip, pause/resume and stale callbacks.

Existing recorded-voice and companion-rig tests cover recorded audio playback, mouth exclusivity, audio-clock visemes, reduced motion and bounded additive poses.
