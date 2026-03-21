import BaseGhost from './ghost.js';
import { findPath, initPathfinding } from './pathfinding.js';

const DEFAULT_COLORS = ['#ff4b4b', '#ff9acd', '#4fc3f7', '#7c4dff'];
const DEFAULT_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
const sharedPathfinder = initPathfinding();

function choose(array, index, fallback) {
    if (!Array.isArray(array) || array.length === 0) {
        return fallback;
    }
    return array[index % array.length] ?? fallback;
}

function resolvePathfinder(gameState, provided) {
    if (provided) {
        return provided;
    }
    if (gameState) {
        const cached = gameState.__pathfinder;
        if (cached) {
            return cached;
        }
        const instance = initPathfinding({ maze: gameState.maze, cellSize: gameState.cellSize });
        Object.defineProperty(gameState, '__pathfinder', {
            value: instance,
            enumerable: false,
            configurable: true,
        });
        return instance;
    }
    return sharedPathfinder;
}

export class Ghost extends BaseGhost {
    constructor(options = {}) {
        super(options);
        const index = Number(options.index) || 0;
        if (!options.color) {
            this.color = choose(DEFAULT_COLORS, index, this.color);
        }
        if (!options.name) {
            this.name = choose(DEFAULT_NAMES, index, this.name);
        }
        this.pathfinder = options.pathfinder ?? null;
    }

    chase(target, gameState, deltaTime = 1 / 60, pathfinderOverride) {
        if (!target) {
            return;
        }
        const pf = pathfinderOverride || this.pathfinder || resolvePathfinder(gameState);
        const path = findPath(
            { x: this.x, y: this.y },
            { x: target.x, y: target.y },
            { pathfinder: pf }
        );
        const waypoint = path[0];
        const bounds = gameState?.getBounds?.() ?? this.bounds;
        if (waypoint) {
            this.moveTowards(waypoint.x, waypoint.y, deltaTime, bounds);
        } else {
            this.moveTowards(target.x, target.y, deltaTime, bounds);
        }
    }
}

export class GhostAI {
    constructor({ ghosts = [], pathfinder } = {}) {
        this.ghosts = ghosts;
        this.pathfinder = pathfinder || null;
    }

    update({ player, gameState, deltaTime = 0 }) {
        updateGhostAI({
            ghosts: this.ghosts,
            player,
            gameState,
            deltaTime,
            pathfinder: this.pathfinder,
        });
    }
}

function internalUpdate({ ghosts = [], player, gameState, deltaTime = 0, bounds, pathfinder } = {}) {
    if (!player || !Array.isArray(ghosts) || ghosts.length === 0) {
        return;
    }
    const resolvedBounds = bounds ?? gameState?.getBounds?.();
    const pf = resolvePathfinder(gameState, pathfinder);
    const dt = Math.max(1 / 240, Number(deltaTime) || 1 / 60);
    ghosts.forEach(ghost => {
        if (!ghost) {
            return;
        }
        if (resolvedBounds) {
            ghost.setBounds(resolvedBounds);
        }
        ghost.update?.(dt);
        if (ghost.isFrightened) {
            ghost.moveTowards(ghost.homeX, ghost.homeY, dt, resolvedBounds);
            return;
        }
        ghost.chase(player, gameState, dt, pf);
    });
}

export function updateGhostAI(arg1, player, deltaTime, bounds, gameState) {
    if (Array.isArray(arg1) || arg1 === undefined) {
        internalUpdate({ ghosts: arg1 || [], player, deltaTime, bounds, gameState });
        return;
    }
    internalUpdate(arg1);
}

export { initPathfinding };