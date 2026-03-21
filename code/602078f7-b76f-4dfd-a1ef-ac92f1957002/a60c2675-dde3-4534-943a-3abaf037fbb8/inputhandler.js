document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            pacman.y -= pacman.speed;
            break;
        case 'ArrowDown':
            pacman.y += pacman.speed;
            break;
        case 'ArrowLeft':
            pacman.x -= pacman.speed;
            break;
        case 'ArrowRight':
            pacman.x += pacman.speed;
            break;
    }
});