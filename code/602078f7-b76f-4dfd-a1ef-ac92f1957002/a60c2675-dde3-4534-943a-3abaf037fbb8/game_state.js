class GameState {
  constructor() {
    this.player = null;
    this.ghosts = [];
    this.score = 0;
  }

  setPlayer(player) {
    this.player = player;
  }

  addGhost(ghost) {
    this.ghosts.push(ghost);
  }

  updateScore(points) {
    this.score += points;
  }

  checkCollisions() {
    this.ghosts.forEach(ghost => {
      if (this.player.x === ghost.x && this.player.y === ghost.y) {
        this.handleCollision();
      }
    });
  }

  handleCollision() {
    console.log('Collision detected!');
    // Handle game over or player losing a life
  }
}

export default GameState;