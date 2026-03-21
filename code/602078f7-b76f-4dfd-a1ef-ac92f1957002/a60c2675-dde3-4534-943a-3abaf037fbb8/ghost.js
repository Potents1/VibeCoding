class Ghost {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  moveTowards(player) {
    if (this.x < player.x) {
      this.x += 1;
    } else if (this.x > player.x) {
      this.x -= 1;
    }
    if (this.y < player.y) {
      this.y += 1;
    } else if (this.y > player.y) {
      this.y -= 1;
    }
  }
}

export default Ghost;