let player = { x: 0, y: 0, speed: 5 };

function movePlayer(direction) {
    switch (direction) {
        case 'up':
            player.y -= player.speed;
            break;
        case 'down':
            player.y += player.speed;
            break;
        case 'left':
            player.x -= player.speed;
            break;
        case 'right':
            player.x += player.speed;
            break;
    }
    checkBounds();
}

function checkBounds() {
    player.x = Math.max(0, Math.min(player.x, canvas.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height));
}

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        movePlayer(key === 'w' ? 'up' : key === 's' ? 'down' : key === 'a' ? 'left' : 'right');
    }
});