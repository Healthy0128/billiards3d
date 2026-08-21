# Third-party licenses

## Runtime libraries

- three.js — MIT License
- cannon-es — MIT License
- three.js GLTFLoader — MIT License (part of the three.js project)

These libraries are loaded from public CDNs.

## Pool table 3D asset

- Runtime model source: `elijah-atkins/Billiards/assets/pool-table/pool-table.glb`
- Source repository: https://github.com/elijah-atkins/Billiards
- The model is loaded at runtime through jsDelivr and is not copied into this repository by this change.
- The source repository README states that its code/resources are derived from `NikLever/threejs-games-course` and `jaks6/WebGL-Billiards`, but the repository does not publish a standalone license for this GLB. Treat the current runtime model as a visual-development asset, not as a cleared redistribution asset.
- Physics and collision geometry remain this project's own Cannon geometry; the external GLB is visual only.
- If the remote model cannot load, the built-in table remains visible automatically.

Before commercial redistribution, replace this runtime model with a locally bundled asset whose redistribution license is explicit (for example a confirmed CC0/CC-BY model) and update this notice.

## Recorded billiard sound effects

The following real recorded billiard/pool sounds are bundled locally in `assets/audio/sfx/`.

- `pool-shots-cc0.mp3`
  - Original: `BILLIARD pool shots- CsG.wav` by csaszi
  - Freesound sound ID: 350918
  - License: Creative Commons Zero (CC0)
  - Used for cue strike and ball-to-ball impact playback.
- `racking-pool-balls-cc0.wav`
  - Freesound sound ID: 274566
  - License: Creative Commons Zero (CC0)
  - Used for rack/reset feedback.

A source note is also stored next to the audio files in `assets/audio/sfx/README.md`.

## Jazz BGM

- Local file: `assets/audio/bgm/jazz-improv-looped-cc0.mp3`
- Original title: `jazz improvisation looped`
- Author: Alex McCulloch / Pro Sensory
- Source: OpenGameArt
- License: Creative Commons Zero (CC0)
- Original downloadable file: `jazz_improv_looped.mp3`
- This track is used as the looping lounge/jazz background music for the `JAZZ ON/OFF` control.

The OpenGameArt page identifies the track as CC0/public domain and describes it as a looped jazz improvisation. Attribution is appreciated by the author but is not required by CC0.
