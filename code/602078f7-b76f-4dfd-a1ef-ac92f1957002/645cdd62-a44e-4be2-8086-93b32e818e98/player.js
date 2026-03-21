class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  move(direction) {
    switch (direction) {
      case 'up':
        this.y -= 1;
        break;
      case 'down':
        this.y += 1;
        break;
      case 'left':
        this.x -= 1;
        break;
      case 'right':
        this.x += 1;
        break;
    }
  }
}

export default Player;