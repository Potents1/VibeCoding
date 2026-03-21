import GameState from './game_state.js';
import Player from './player.js';
import Ghost from './ghost.js';

const gameState = new GameState();
const player = new Player(5, 5);
const ghost = new Ghost(3, 3);

gameState.setPlayer(player);
gameState.addGhost(ghost);

function gameLoop() {
  player.move('up');
  ghost.moveTowards(player);
  gameState.checkCollisions();
  requestAnimationFrame(gameLoop);
}

gameLoop();