function checkCollision(entityA, entityB) {
  return entityA.x < entityB.x + entityB.width &&
         entityA.x + entityA.width > entityB.x &&
         entityA.y < entityB.y + entityB.height &&
         entityA.y + entityA.height > entityB.y;
}

module.exports = { checkCollision };