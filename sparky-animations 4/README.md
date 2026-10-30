# Sparky rig animation pack

Serve this folder over HTTP and open `preview.html`. Browser playback uses the
bundled Spine 4.2 runtime; no CDN or package installation is required.

Keep `assets/` and `vendor/` together with their filenames intact. `manifest.json`
lists selected clips with exact animation names, durations, loop flags and pose
labels. The skeleton contains the shared full rig and animation data because
clips use common bones, constraints, meshes and attachment timelines. A selection
limits the manifest and preview; it does not remove other clips from the binary.

```js
import {SparkyRigPlayer} from './rig-player.js';
const rig = await SparkyRigPlayer.load('./manifest.json');
const clip = rig.manifest.animations[0];
const actor = rig.add(document.querySelector('canvas'), clip.name, {loop: clip.loop});
// actor.restart(); actor.seek(0.5); actor.destroy(); rig.destroy();
```

Use one renderer for multiple actors. All clips use the same fixed camera and
character scale. A zero-duration entry is a static pose. Gallery previews repeat
actions for inspection; game playback should use each manifest loop flag.

The atlas is premultiplied-alpha, Linear, 4096×4096. The JSON manifest is an index,
not a Spine JSON skeleton: use the supplied `.skel` with Spine 4.2. For Unity,
Godot or another engine use a compatible Spine integration and select animations
by their exact names. Review prop contacts and framing for your game; the fixed
camera can crop translating actions and large props.

Retain `vendor/SPINE-LICENSE.txt`. Spine editor/runtime licensing applies to
integration and distribution; the bundled notice describes the terms.

Game integration: `add` also accepts an optional `baseClip` to apply a fixed base attachment pose beneath sparse action timelines. The optional `preserveSlots` array retains named attachments from that base even when the action hides them. The picture puzzle uses both options for Lookaround Sad so it retains the complete body.

Actors also provide `setAnimation(name, {loop, mixSeconds, preserveSlots})` for transitions on the same skeleton. The player advances Spine mixing with the shared playback clock, so transitions freeze when paused.
