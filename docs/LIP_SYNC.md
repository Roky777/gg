# Recorded speech performance

All 165 supplied MP3s have offline phonetic mouth cues in `lip-sync-data.js`. They were generated with Rhubarb Lip Sync 1.14.0 using its language-independent `phonetic` recognizer and `--extendedShapes X`, matching this rig's native A-F and X drawings. Rhubarb documents non-English support and the limits of automatic phonetic recognition here: https://github.com/DanielSWolf/rhubarb-lip-sync#recognizers . Automatically generated alignment is not a claim of hand-reviewed phoneme-perfect performance for every recording.

`LearningVoice.speechFrame()` samples the reused audio element's `currentTime`; no repeating unrelated vocal motion drives recorded speech. Loading, queued gaps and buffering select the relaxed X mouth. Muting, navigation, pause and audio completion remove the speech override and restore the underlying authored expression. The existing mouth masks and native facial placement are retained so the resting lips cannot draw over the speech mouth. Only the native D mesh needs the authored jaw placement sampled at 0.30 seconds. Mouth drawings switch at the generated cue boundaries; facial cues do not modify body scale, root movement or feet.

Audio `playing` starts gestures: instructions/help use a guide gesture, counted numbers and letter readings get a bounded nod, and welcome recordings can use a wave. Existing task-specific authored celebrations remain in control. A buffering restart does not restart the gesture. Reduced motion disables decorative gestures but still lets the audio clock drive essential mouth cues. Device-TTS fallback retains the original generic facial animation because it has no recorded phonetic track.

Regenerate after changing recordings:

```
python3 tools/index-recorded-voices.py
python3 tools/build-lip-sync.py --rhubarb /path/to/rhubarb
```

The build tool runs locally; the deployed game includes only generated cues, existing native mouth artwork and audio, with no Rhubarb binary or runtime dependency. Cached analysis is keyed by SHA-256. `tests/lip-sync.mjs` checks every audio hash, cue boundary, range and expected shape. `tests/recorded-voice.mjs` checks the audio clock, buffering and cancellation. `tests/companion-rig.mjs` checks the actual 201-bone skeleton, native visemes, old-lip suppression, action blending and stable body/feet. Browser visual checks covered the seven drawings and recorded help, counting and thumbs-up celebration through `lip-sync-review.html` (not included in the production build).
