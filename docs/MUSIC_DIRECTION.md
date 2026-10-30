# Sparky's Puzzle Garden — music direction

## Creative brief

The music should feel like a kind friend quietly playing beside a child in a sunny garden: warm, curious, safe and lightly playful. It supports attention while moving picture strips. It should stay pleasant after ten minutes of repetition. This is a creative target; children have different musical preferences, so review at low volume with the intended audience.

## Main gameplay loop

- Tempo: 76 BPM, steady 4/4 with a gentle lilting feel. Avoid a strong marching pulse.
- Key: C major; mostly C major pentatonic melody (C D E G A).
- Harmony: warm C(add9), Am7, Fmaj7 and Gsus2 shapes. Slow harmonic rhythm, one chord per bar or two bars. Gentle inversions; no dramatic tension or emphatic final cadence.
- Lead: soft felt piano, with an occasional rounded wooden marimba answering a short phrase. A small, memorable three-to-five-note motif, mostly stepwise, followed by several beats of space. Keep within roughly one octave.
- Support: very quiet fingerpicked nylon-string guitar or muted ukulele, sparse warm bass notes, and an airy soft pad low in the mix. Choose one plucked supporting instrument; avoid stacking every instrument continuously.
- Sparkle: rare soft celesta notes at phrase boundaries, never a constant stream of bright bells. No piercing upper-register transients.
- Rhythm: optional feather-light shaker, barely audible. No heavy kick, snare backbeat, fast hi-hats or claps that compete with game feedback.
- Density: two or three active musical layers at most. No vocals, lyrics, spoken words, crowd sounds, whistles or animal effects.

## Structure and looping

Create a 32-bar loop at76BPM: approximately101.05seconds. Bars1–8 introduce the sparse motif;9–16 add one gentle marimba answer;17–24 reduce the melody and let the soft accompaniment breathe;25–32 return to the first idea with a tiny variation. Keep energy and volume level throughout.

The final bar must flow into bar1. No opening countdown, obvious intro, fade-in, final hit, ending cadence, or fade-out. Render reverb across the loop boundary. If the generator cannot produce a genuinely seamless loop, export a longer take and cut at matching bar boundaries in an audio editor; audition the join repeatedly. A prompt alone cannot guarantee sample-accurate looping.

## Game integration and mixing

Start music only after the first player interaction. Fade in over2seconds. Keep it softer than the strip-swap and success sounds: begin with a music bus around0.06–0.08 gain and adjust by listening on phone speakers. Use one sound control to mute/unmute music and effects together. Pause or suspend audio when the tab is hidden; resume only when gameplay is active. Do not restart the music on every puzzle.

Briefly duck the music about3–4dB during a success chime, recovering over roughly0.8seconds. Avoid jumps in loudness. Aim for a gentle, clean master around−20 to−18LUFS integrated as an initial production target, with true peak at or below−2dBTP; verify perceived loudness on the actual game/device, since a meter target does not establish a safe listening level.

Delivery:48kHz,24-bit WAV master, stereo. Also provide compressed OGG and AAC/M4A runtime copies, and separate melody/accompaniment stems if possible. Check mono compatibility and a click-free loop boundary. No clipping or aggressive limiting.

## Related cues

Use the same key and instrument palette for all cues.

- Piece selected: one short, soft wooden pluck, about100ms.
- Strip swap: a quiet rounded two-note figure, about180ms; no harsh error buzzer.
- Picture complete: a small ascending C–E–G–C celesta or marimba phrase,0.7–1.0seconds, restrained sparkle and soft tail.
- Collection complete: a slightly fuller2-second variation, not a loud fanfare.
- Buttons: a gentle tap/pop, quieter than the success cue.

Do not play a failure sound for exploratory swaps. The child should feel free to try again. Avoid scheduling extra background sound effects over the music.

## Copy-and-paste generation prompt

Create an original instrumental background music loop for a preschool picture puzzle game called Sparky's Puzzle Garden. Mood: calming, warm, tender, sunny, quietly curious and gently playful, like a small music box in a friendly garden.76BPM,4/4, C major, mostly C-major pentatonic melody. A soft felt piano plays a simple three-to-five-note motif with generous pauses; a rounded wooden marimba occasionally answers. Underneath, very quiet fingerpicked nylon-string guitar, sparse warm bass notes and a subtle airy pad. Rare delicate celesta accents only at phrase boundaries. Optional barely audible shaker. Two or three active layers at most. Soft attacks, warm midrange, restrained high frequencies, consistent gentle dynamics. The melody should be memorable without becoming insistent or busy.32bars, approximately101seconds, with small variations and a quieter middle passage. A seamless repeating gameplay loop: final bar flows naturally into first bar, no dramatic ending, no fade-in or fade-out, reverb continues smoothly across the loop. Leave room for game sound effects. Original composition, no quotation of nursery rhymes or existing melodies. Instrumental only, no voices or lyrics.

## Negative prompt

No vocals, speech, choir, nursery-rhyme quotations, loud drums, EDM, heavy bass, busy arpeggios, piercing bells, harsh synths, dramatic orchestra, sad or suspenseful passages, sudden loudness changes, risers, drops, cymbal crashes, clapping, whistling, sound effects, aggressive compression, long intro, final hit, fade-out or obvious ending.

## Short prompt for generators with limited input

Calming preschool puzzle-game instrumental,76BPM, C major pentatonic, soft felt piano, rounded marimba answers, quiet nylon guitar, warm bass and airy pad. Sparse playful melody, soft attacks, gentle steady volume, sunny and tender.32-bar seamless loop around101seconds. No vocals, heavy drums, sharp bells, dramatic changes, intro or ending. Leave space for game sounds.

## Implemented soundtrack

The user-supplied Daylight_on_the_Carpet.mp3 is now bundled unchanged at assets/audio/daylight-on-the-carpet.mp3 (stereo44.1kHz, approximately103.68seconds). game-audio.js implements looping playback, gesture unlock, fade-in, music/effects mixing, gentle interaction cues, success ducking, shared mute, and pause/visibility handling. The supplied file's existing beginning/end are used for the loop; the code does not claim the recording is a seamless musical loop.

## Current runtime mix

Uses the supplied `assets/audio/Sunny_Afternoon_Meadow.mp3` (about 2m58s), preserved without re-encoding. Music bus gain is 0.07 (about −23 dB relative to the file). Speech reduces it to 0.018 (about −35 dB relative to the file), with a 150 ms dip and 850 ms return. First interaction fades in over 2 seconds. Repeated input does not reset the fade or lift speech ducking. Effects bus gain is 0.45. The track loops continuously across boards; mute, pause and hidden-tab handling remain. Source measurement: mean −14.3 dBFS, peak −0.2 dBFS before playback attenuation. Actual listening level still follows the device volume.
