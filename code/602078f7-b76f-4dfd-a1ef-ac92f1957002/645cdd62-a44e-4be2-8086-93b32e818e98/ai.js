// ai.js
function updateGhosts() {
    ghosts.forEach(ghost => {
        // Simple AI to follow player
        if (ghost.x < player.x) ghost.x += ghost.speed;
        if (ghost.x > player.x) ghost.x -= ghost.speed;
        if (ghost.y < player.y) ghost.y += ghost.speed;
        if (ghost.y > player.y) ghost.y -= ghost.speed;
    });
}

function gameLoop() {
    update();
    updateGhosts();
    requestAnimationFrame(gameLoop);
}

gameLoop();