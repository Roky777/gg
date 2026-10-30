# Sparky animation events

The game uses the supplied `sparky-animations 4` Spine 4.2 pack. All actions share its skeleton, atlas, texture, bundled runtime, and fixed camera. No external dependency or CDN is used.

| Situation | Exact pack animation | Playback |
| --- | --- | --- |
| Waiting between reactions | `0Final/Idle/Idle_EB` | Loop |
| Puzzle begins, if Sparky is resting | `0Final/Idle/Lookaround_Wow` | Once |
| 18 seconds without interaction | Alternate Lookaround Wow and `0Final/Wow_2` while resting | Once |
| Swap improves correct strip placement | Alternate `0Final/Appreciation/Thumbs_Up_2` and `0Final/Appreciation/Yeahh_1` | Once |
| Swap reduces correct strip placement | `Sequence/1/Lookaround_Sad` | Once |
| Swap leaves correctness unchanged | Continue current action | — |
| Puzzle completed | Cycle Clapping, `0Final/Appreciation/Hurray`, and `0Final/Woohoo` | Once |
| Every fifth completion | `0Final/Super_Happy` | Once |
| Tap Sparky | Cycle Wow 2, Woohoo, Super Happy and Hurray | Once |
| Action completed | `0Final/Idle/Idle_EB` | Loop |
| Hidden tab or pause | Freeze current playback clock | Resume at the same time |
| Reduced motion | First frame of `0Final/Idle/Idle_EB` | Still |

The director keeps one skeleton and animation state alive across every action. It blends into reactions over 0.22 seconds and lets each complete action finish before blending back to idle over 0.45 seconds. A queued reaction waits for this recovery plus a 0.3 second settling beat. All timing uses the paused rig clock. The newest priority response is retained. Completion is measured against the rig's playback clock and manifest duration so paused time does not complete an action. Every clip uses the manifest's exact name and loop flag. The game waits for the rig and puzzle images before removing the loading screen.

Lookaround Sad hides the body attachments in the supplied timeline. The game applies the idle pose on a lower track and preserves its body attachments while the sad face and head motion play. The bundled player accepts optional `baseClip` and `preserveSlots` arguments for this composition; skeleton data and the fixed camera remain unchanged.

Keep the pack's `assets/`, `vendor/`, and `vendor/SPINE-LICENSE.txt` together. Its manifest includes unrelated activity clips; the game selects only the ten animations above. Old sprite sheets, reconstructed rigs, backup players and color calibration files have been removed from the game folder and package.

Quiet reactions never queue behind an active action and are suppressed while dragging, selecting, paused, hidden or on a completed puzzle. Interaction resets the 18 second timer. The transparent Play with Sparky button also supports keyboard activation. Reduced motion keeps Sparky still for all of these events.
