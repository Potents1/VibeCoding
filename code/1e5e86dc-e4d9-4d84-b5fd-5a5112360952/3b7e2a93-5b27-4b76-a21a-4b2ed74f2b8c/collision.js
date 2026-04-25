export function checkCollision(player, ghosts){
  return ghosts.some(g => Math.abs((g.x||0)-(player.x||0)) < 1 && Math.abs((g.y||0)-(player.y||0)) < 1);
}
