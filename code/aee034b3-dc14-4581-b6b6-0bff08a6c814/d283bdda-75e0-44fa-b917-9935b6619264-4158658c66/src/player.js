export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    r: 0.22,
    angle: spawn.angle ?? 0,
    moveSpeed: 3.2,
    turnSpeed: 2.4,
    hp: 100,
    maxHp: 100,
    shootCooldown: 0,
    weaponDamage: 25,
    weaponRange: 6.5,
    weaponFov: (12 * Math.PI) / 180
  };
}
