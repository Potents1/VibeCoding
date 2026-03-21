class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class PacMan extends Entity {
  constructor(x, y) {
    super(x, y, 30, 30);
  }
}

class Ghost extends Entity {
  constructor(x, y) {
    super(x, y, 30, 30);
  }
}

class Pellet extends Entity {
  constructor(x, y) {
    super(x, y, 10, 10);
  }
}

class Wall extends Entity {
  constructor(x, y) {
    super(x, y, 40, 40);
  }
}

module.exports = { PacMan, Ghost, Pellet, Wall };