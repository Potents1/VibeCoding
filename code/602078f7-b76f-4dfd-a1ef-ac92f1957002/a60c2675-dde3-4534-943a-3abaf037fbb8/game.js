import GameState from './game_state.js';
import Player from './player.js';
import { pollInput } from './input.js';
import { checkCollision } from './collision.js';
import { Ghost, updateGhostAI } from './ghostAI.js';

const hasDOM = typeof document !== 'undefined';
const doc = hasDOM ? document : null;
const canvas = doc ? doc.getElementById('gameCanvas') : null;
const ctx = canvas?.getContext?.('2d') ?? null;
const hud = {
    score: doc ? doc.getElementById('scoreValue') : null,
    lives: doc ? doc.getElementById('livesValue') : null,
    status: doc ? doc.getElementById('statusValue') : null,
};

const gameState = new GameState();
const bounds = gameState.getBounds();
if (canvas) {
    canvas.width = bounds.width;
    canvas.height = bounds.height;
}

const player = new Player({ bounds, cellSize: gameState.cellSize, radius: 12 });
const playerSpawnPoint = gameState.cellCenter(13, 15);
player.resetPosition(playerSpawnPoint.x, playerSpawnPoint.y);
gameState.setPlayer(player);

const ghosts = createGhosts(gameState);
gameState.setGhosts(ghosts);

let lastTimestamp = null;
let loopStarted = false;

function createGhosts(state) {
    const spawnRow = 9;
    const spawnCols = [13, 14, 12, 15];
    const ghostBounds = state.getBounds();
    return spawnCols.map((col, index) => {
        const spawn = state.cellCenter(col, spawnRow);
        return new Ghost({
            index,
            x: spawn.x,
            y: spawn.y,
            bounds: ghostBounds,
            cellSize: state.cellSize,
            speed: 70 + index * 5,
        });
    });
}

function parseCellKey(key) {
    const [colStr, rowStr] = (key ?? '').split(':');
    const col = Number(colStr);
    const row = Number(rowStr);
    if (!Number.isInteger(col) || !Number.isInteger(row)) {
        return null;
    }
    return { col, row };
}

function drawMaze() {
    if (!ctx) {
        return;
    }
    ctx.fillStyle = '#06021a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#12215c';
    gameState.maze.forEach((row, rowIndex) => {
        [...row].forEach((tile, colIndex) => {
            if (tile !== '#') {
                return;
            }
            ctx.fillRect(
                colIndex * gameState.cellSize,
                rowIndex * gameState.cellSize,
                gameState.cellSize,
                gameState.cellSize
            );
        });
    });
}

function drawPellets() {
    if (!ctx) {
        return;
    }
    ctx.fillStyle = '#ffd966';
    gameState.pellets.forEach(key => {
        const cell = parseCellKey(key);
        if (!cell) {
            return;
        }
        const center = gameState.cellCenter(cell.col, cell.row);
        ctx.beginPath();
        ctx.arc(center.x, center.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#ffb347';
    gameState.powerPellets.forEach(key => {
        const cell = parseCellKey(key);
        if (!cell) {
            return;
        }
        const center = gameState.cellCenter(cell.col, cell.row);
        ctx.beginPath();
        ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawEntities() {
    if (!ctx) {
        return;
    }
    ghosts.forEach(ghost => ghost.draw?.(ctx));
    player.draw(ctx);
}

function updateHud() {
    if (!hud.score) {
        return;
    }
    hud.score.textContent = String(gameState.score);
    hud.lives.textContent = String(gameState.lives);
    hud.status.textContent = gameState.status;
}

function handleCollisionResult(collision) {
    if (!collision) {
        return;
    }
    if (collision.frightened) {
        gameState.score += 200;
        collision.hitGhost?.sendHome?.();
        return;
    }
    if (gameState.status === 'over') {
        return;
    }
    gameState.lives -= 1;
    if (gameState.lives <= 0) {
        gameState.status = 'over';
        return;
    }
    gameState.status = 'respawn';
    player.resetPosition(playerSpawnPoint.x, playerSpawnPoint.y);
    ghosts.forEach(ghost => ghost.sendHome());
}

export function updateGameState(timestamp = (globalThis.performance?.now?.() ?? Date.now())) {
    const numericTimestamp = Number(timestamp) || 0;
    if (lastTimestamp === null) {
        lastTimestamp = numericTimestamp;
    }
    const delta = Math.min(0.1, Math.max(0, (numericTimestamp - lastTimestamp) / 1000));
    lastTimestamp = numericTimestamp;

    const inputSnapshot = pollInput();
    player.update(delta, inputSnapshot.direction, gameState, gameState.getBounds());

    const consumed = gameState.consumePelletAt(player.x, player.y);
    if (consumed === 'power') {
        ghosts.forEach(ghost => ghost.frighten(6));
    }

    updateGhostAI({
        ghosts,
        player,
        gameState,
        deltaTime: delta,
    });

    const collision = checkCollision(player, ghosts, gameState);
    handleCollisionResult(collision);
    if (gameState.remainingPellets() === 0 && gameState.status !== 'over') {
        gameState.status = 'won';
    } else if (gameState.status === 'respawn') {
        gameState.status = 'running';
    }

    updateHud();
    if (ctx) {
        drawMaze();
        drawPellets();
        drawEntities();
    }

    return {
        score: gameState.score,
        lives: gameState.lives,
        status: gameState.status,
        pellets: gameState.remainingPellets(),
    };
}

function restartGame() {
    gameState.reset();
    player.resetPosition(playerSpawnPoint.x, playerSpawnPoint.y);
    ghosts.forEach(ghost => ghost.sendHome());
    gameState.status = 'running';
    updateHud();
    if (ctx) {
        drawMaze();
        drawPellets();
        drawEntities();
    }
}

function attachControls() {
    if (!hasDOM) {
        return;
    }
    const restartButton = doc.getElementById('restartButton');
    restartButton?.addEventListener('click', restartGame);
    window.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            restartGame();
        }
    });
}

function step(timestamp) {
    updateGameState(timestamp);
    scheduleNextFrame();
}

function scheduleNextFrame() {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(step);
    } else {
        setTimeout(() => step(globalThis.performance?.now?.() ?? Date.now()), 1000 / 60);
    }
}

function bootGame() {
    if (loopStarted) {
        return;
    }
    loopStarted = true;
    restartGame();
    attachControls();
    scheduleNextFrame();
}

if (hasDOM) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootGame, { once: true });
    } else {
        bootGame();
    }
} else {
    restartGame();
}