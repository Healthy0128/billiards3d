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
