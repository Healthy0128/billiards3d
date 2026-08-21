# Third-party licenses

## Runtime libraries

- three.js — MIT License
- cannon-es — MIT License
- JSZip — MIT License
- three.js OBJLoader / MTLLoader — MIT License (part of the three.js project)

These libraries are loaded from public CDNs.

## Pool table 3D asset

- Title: Pool Table (Low poly)
- Author: STKRudy85
- Source: https://opengameart.org/content/pool-table-low-poly
- Asset package: Pool-table.zip
- License: CC0 / Public Domain
- Usage in this project: the model is fetched from the original OpenGameArt asset URL at runtime, parsed in the browser, normalized to the game's 9-foot table dimensions, and used only for visual rendering. The game's own Cannon collision geometry remains authoritative for physics.
- Fallback: if the external asset cannot be loaded, the built-in procedural table remains visible so gameplay is not blocked.

No recorded music or sound-effect files are bundled by this change.
