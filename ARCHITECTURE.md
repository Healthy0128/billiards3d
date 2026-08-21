# 3D Billiards Architecture

## Production entry point

`index.html` loads the production build in this order:

1. `src/main11.js` — authoritative game core
2. `src/recorded-sfx.js` — recorded billiards SFX adapter
3. `src/jazz-bgm.js` — local CC0 jazz BGM adapter
4. `src/cue-ball-marker.js` — cue-ball marker using the core frame loop
5. `src/shot-flow.js` — touch shot-flow controller (aim and power are separated)

## Core rule

`src/main11.js` is the single source of truth for:

- Three.js scene and renderer
- Cannon physics world
- table dimensions
- ball dimensions and positions
- rails and pocket capture geometry
- ball motion and stopping
- pocket drop animation
- camera state
- aiming state
- game rules for practice / 8-ball / 9-ball
- the single requestAnimationFrame loop

Do not modify the core by fetching its source as text and replacing strings.
New features should use the public runtime API instead.

## Runtime API

External modules may use `window.__billiardsRuntime`.
Current stable members include:

- `version`
- `scene`
- `THREE`
- `table`
- `ballR`
- `camera`
- `audio`
- `getCueBall()`
- `getBalls()`
- `getAimAngle()`
- `setAimAngle(angle)`
- `getMode()`
- `getCurrentPlayer()`
- `getGroups()`
- `isGameOver()`
- `onFrame(callback)`

The runtime dispatches `billiards:ready` when this API is ready.

## Animation policy

There must be only one main `requestAnimationFrame` loop: the loop in `main11.js`.
Visual helpers should subscribe through `runtime.onFrame()` instead of creating their own permanent RAF loops.

## Input policy

- Browse camera input is owned by `main11.js` while `body[data-phase="view"]` is active.
- Aim direction is changed only by the aim controls.
- Pull gesture is owned by `shot-flow.js` and changes power only.
- Pulling must never change aim direction.

## Audio policy

The core exposes a minimal audio API. Recorded SFX and jazz BGM may replace/extend that API without touching the game source.
For iOS Safari, media playback must begin from a direct user gesture.

## Legacy files

The following files are retained only as rollback/history references and are not loaded by production `index.html`:

- `src/main10.js`
- `src/main101.js`
- `src/main7.js`
- `src/bootstrap8.js`
- `src/bootstrap9.js`

Do not build new features on top of these files.

## Version

Current stability refactor: `v1.1.0`.
