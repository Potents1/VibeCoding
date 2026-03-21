export class PlayerControls {
    constructor() {
        this.keys = {};
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    update() {
        if (this.keys['ArrowUp']) {
            // Move player up
        }
        if (this.keys['ArrowDown']) {
            // Move player down
        }
        if (this.keys['ArrowLeft']) {
            // Move player left
        }
        if (this.keys['ArrowRight']) {
            // Move player right
        }
    }
}