export function createWorld() {
  const bounds = { x: 0, y: 0, w: 900, h: 520 };

  // Simple corridor with blockers; deterministic layout.
  const solids = [
    // Outer walls (thin)
    { x: 0, y: 0, w: 900, h: 16 },
    { x: 0, y: 504, w: 900, h: 16 },
    { x: 0, y: 0, w: 16, h: 520 },
    { x: 884, y: 0, w: 16, h: 520 },

    // Interior blocks
    { x: 160, y: 80, w: 60, h: 320 },
    { x: 300, y: 120, w: 80, h: 320 },
    { x: 460, y: 40, w: 70, h: 320 },
    { x: 610, y: 140, w: 70, h: 320 },
    { x: 740, y: 40, w: 50, h: 260 }
  ];

  const playerSpawn = { x: 40, y: 440, w: 28, h: 28 };
  const droneSpawn = { x: 420, y: 440, w: 30, h: 30 };
  const goal = { x: 828, y: 46, w: 44, h: 44 };

  return {
    bounds,
    solids,
    goal,
    playerSpawn,
    droneSpawn,
    playerSpeed: 260,
    droneSpeed: 185,
    dronePatrolFreq: 1.2,
    dronePatrolAmp: 1
  };
}
