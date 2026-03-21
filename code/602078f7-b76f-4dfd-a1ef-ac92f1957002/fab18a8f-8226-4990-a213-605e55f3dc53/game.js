const { PacMan, Ghost, Pellet, Wall } = require('./entities');
const { checkCollision } = require('./collision');

class Game {
  constructor() {
    this.pacMan = new PacMan(5, 5);
    this.ghosts = [new Ghost(1, 1), new Ghost(8, 8)];
    this.pellets = [new Pellet(3, 3), new Pellet(6, 6)];
    this.walls = [new Wall(4, 4), new Wall(7, 7)];
  }

  update() {
    this.checkCollisions();
  }

  checkCollisions() {
    this.ghosts.forEach(ghost => {
      if (checkCollision(this.pacMan, ghost)) {
        console.log('Pac-Man collided with a ghost!');
      }
    });

    this.pellets.forEach((pellet, index) => {
      if (checkCollision(this.pacMan, pellet)) {
        console.log('Pac-Man collected a pellet!');
        this.pellets.splice(index, 1);
      }
    });

    this.walls.forEach(wall => {
      if (checkCollision(this.pacMan, wall)) {
        console.log('Pac-Man hit a wall!');
      }
    });
  }
}

const game = new Game();
setInterval(() => game.update(), 1000 / 60);