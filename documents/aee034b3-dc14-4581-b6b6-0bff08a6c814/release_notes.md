# mini-wolf3d — Release Notes

## 0.1.0

### Gameplay
- Wolfenstein-3D-inspired raycast FPS.
- Objective: eliminate all enemies, then reach the exit tile (X / cyan).
- Enemies use line-of-sight checks (no shooting/vision through walls) and melee damage on close contact.
- Shooting uses FOV + range + occlusion checks.

### Controls
- W/S: move forward/back
- A/D: strafe
- Q/E or Left/Right arrows: turn
- Space: shoot
- R: restart

### Performance / Reliability
- Fixed-timestep simulation.
- Deterministic unit + smoke tests.
- Raycaster guarded against infinite loops; perf budget tests included.

### Dev / Deploy
- `npm start` serves static files from the repo root.
- No external dependencies.
