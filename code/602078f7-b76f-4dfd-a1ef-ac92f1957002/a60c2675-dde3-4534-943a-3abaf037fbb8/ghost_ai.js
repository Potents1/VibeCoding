import BaseGhost from './ghost.js';
import { initPathfinding } from './pathfinding.js';

const DEFAULT_SCATTER_TARGETS = [
    { col: 1, row: 1 },
    { col: 24, row: 1 },
    { col: 1, row: 16 },
    { col: 24, row: 16 },
];

const PATHFINDER_KEY = Symbol.for('pacman.pathfinder');
let sharedPathfinder;

function clamp(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(max, Math.max(min, value));
}

function clampPoint(point, bounds) {
    if (!point) {
        return null;
    }
    if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) {
        return point;
    }
    return {
        x: clamp(point.x, 0, bounds.width),
        y: clamp(point.y, 0, bounds.height),
    };
}

function toPoint(value, cellSize = 16) {
    if (value == null) {
        return null;
    }
    const size = Number(cellSize) > 0 ? Number(cellSize) : 16;
    if (Number.isFinite(value.x) && Number.isFinite(value.y)) {
        return { x: Number(value.x), y: Number(value.y) };
    }
    if (Number.isFinite(value.col) && Number.isFinite(value.row)) {
        return {
            x: value.col * size + size / 2,
            y: value.row * size + size / 2,
        };
    }
    if (Array.isArray(value) && value.length >= 2) {
        const [col, row] = value;
        if (Number.isFinite(col) && Number.isFinite(row)) {
            return {
                x: col * size + size / 2,
                y: row * size + size / 2,
            };
        }
    }
    if (Number.isFinite(value)) {
        return { x: Number(value), y: Number(value) };
    }
    return null;
}

function ensurePathfinder(gameState) {
    if (gameState) {
        const existing = gameState[PATHFINDER_KEY];
        if (existing) {
            return existing;
        }
        const maze = Array.isArray(gameState.maze) ? gameState.maze : undefined;
        const cellSize = Number(gameState.cellSize) || 16;
        const pathfinder = initPathfinding({ maze, cellSize });
        Object.defineProperty(gameState, PATHFINDER_KEY, {
            value: pathfinder,
            enumerable: false,
            configurable: true,
        });
        return pathfinder;
    }
    if (!sharedPathfinder) {
        sharedPathfinder = initPathfinding();
    }
    return sharedPathfinder;
}

function ensureGhostAIInstance(ghost, slotIndex = 0) {
    if (!ghost) {
        return null;
    }
    if (ghost.ai instanceof GhostAI) {
        return ghost.ai;
    }
    const scatterCell = DEFAULT_SCATTER_TARGETS[slotIndex % DEFAULT_SCATTER_TARGETS.length];
    const scatterTarget = toPoint(scatterCell, ghost.cellSize);
    const config = ghost.ai && typeof ghost.ai === 'object' ? { ...ghost.ai } : {};
    const ai =
        config instanceof GhostAI
            ? config
            : new GhostAI({
                  mode: config.mode ?? ghost.personality ?? 'chase',
                  scatterTarget: config.scatterTarget ?? scatterTarget,
                  pathfinder: config.pathfinder,
              });
    if (!ai.scatterTarget && scatterTarget) {
        ai.scatterTarget = scatterTarget;
    }
    ghost.ai = ai;
    return ai;
}

function normalizeTarget(target, ghost, bounds) {
    if (!ghost) {
        return null;
    }
    return clampPoint(toPoint(target, ghost.cellSize), bounds);
}

export class Ghost extends BaseGhost {
    constructor(options = {}) {
        super(options);
        const config = typeof options === 'object' && options !== null ? options : {};
        this.personality = config.personality ?? config.behavior ?? 'chase';
        const scatterTarget = toPoint(config.scatterTarget, this.cellSize);
        if (config.ai instanceof GhostAI) {
            this.ai = config.ai;
        } else {
            this.ai = new GhostAI({
                mode: this.personality,
                scatterTarget,
                pathfinder: config.pathfinder,
            });
        }
    }

    chase(target, deltaTime = 0, bounds, gameState, pathfinder) {
        const ai = ensureGhostAIInstance(this);
        ai.chase(this, target, deltaTime, bounds, gameState, pathfinder);
    }

    stepAI(player, deltaTime = 0, bounds, gameState, pathfinder) {
        const ai = ensureGhostAIInstance(this);
        ai.update(this, player, deltaTime, bounds, gameState, pathfinder);
    }
}

export class GhostAI {
    constructor(options = {}) {
        const config = typeof options === 'object' && options !== null ? options : {};
        this.mode = config.mode ?? config.behavior ?? 'chase';
        this.speedMultiplier = Number(config.speedMultiplier) || 1;
        this.scatterTarget = toPoint(config.scatterTarget, config.cellSize);
        this.pathfinder = config.pathfinder ?? null;
        this.random = typeof config.random === 'function' ? config.random : Math.random;
    }

    setMode(mode) {
        if (typeof mode === 'string' && mode.length) {
            this.mode = mode;
        }
    }

    setScatterTarget(target, cellSize = 16) {
        const resolved = toPoint(target, cellSize);
        if (resolved) {
            this.scatterTarget = resolved;
        }
    }

    chase(ghost, target, deltaTime = 0, bounds, gameState, pathfinder) {
        const destination = normalizeTarget(target, ghost, bounds) ?? this.resolveScatterTarget(ghost, bounds);
        this.follow(ghost, destination, deltaTime, bounds, gameState, pathfinder);
    }

    scatter(ghost, deltaTime = 0, bounds, gameState, pathfinder) {
        const destination = this.resolveScatterTarget(ghost, bounds);
        this.follow(ghost, destination, deltaTime, bounds, gameState, pathfinder);
    }

    flee(ghost, player, deltaTime = 0, bounds) {
        const target = this.computeFleeTarget(ghost, player, bounds);
        this.directMove(ghost, target, deltaTime, bounds);
    }

    update(ghost, player, deltaTime = 0, bounds, gameState, pathfinder) {
        if (!ghost) {
            return;
        }
        if (ghost.isFrightened) {
            this.flee(ghost, player, deltaTime, bounds);
            return;
        }
        if (this.mode === 'scatter' && !player) {
            this.scatter(ghost, deltaTime, bounds, gameState, pathfinder);
            return;
        }
        this.chase(ghost, player, deltaTime, bounds, gameState, pathfinder);
    }

    follow(ghost, destination, deltaTime, bounds, gameState, pathfinder) {
        if (!ghost || !destination) {
            return;
        }
        const waypoint = this.selectWaypoint(ghost, destination, gameState, pathfinder);
        this.directMove(ghost, waypoint, deltaTime, bounds);
    }

    selectWaypoint(ghost, destination, gameState, pathfinder) {
        const pf = pathfinder ?? this.pathfinder ?? ensurePathfinder(gameState);
        if (!pf?.findPath) {
            return destination;
        }
        const path = pf.findPath({ x: ghost.x, y: ghost.y }, destination) ?? [];
        if (path.length > 1) {
            return path[1];
        }
        if (path.length === 1) {
            return path[0];
        }
        return destination;
    }

    directMove(ghost, target, deltaTime, bounds) {
        const destination = clampPoint(target, bounds);
        if (!destination) {
            return;
        }
        const dt = Number(deltaTime) > 0 ? Number(deltaTime) * this.speedMultiplier : deltaTime;
        ghost.moveTowards(destination.x, destination.y, dt, bounds);
    }

    resolveScatterTarget(ghost, bounds) {
        if (this.scatterTarget) {
            return clampPoint(this.scatterTarget, bounds);
        }
        if (Number.isFinite(ghost?.homeX) && Number.isFinite(ghost?.homeY)) {
            return clampPoint({ x: ghost.homeX, y: ghost.homeY }, bounds);
        }
        return clampPoint({ x: ghost?.x ?? 0, y: ghost?.y ?? 0 }, bounds);
    }

    computeFleeTarget(ghost, player, bounds) {
        const source = player ?? { x: ghost.x, y: ghost.y };
        let dx = ghost.x - source.x;
        let dy = ghost.y - source.y;
        if (!dx && !dy) {
            const angle = (this.random?.() ?? Math.random()) * Math.PI * 2;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        }
        const scale = Math.max(ghost.cellSize * 4, 32);
        const target = {
            x: ghost.x + dx * scale,
            y: ghost.y + dy * scale,
        };
        return clampPoint(target, bounds);
    }
}

export function updateGhostAI(ghosts, player, deltaTime = 0, bounds, gameState) {
    if (!Array.isArray(ghosts) || ghosts.length === 0) {
        return;
    }
    const pathfinder = ensurePathfinder(gameState);
    ghosts.forEach((ghost, index) => {
        if (!(ghost instanceof BaseGhost)) {
            return;
        }
        if (bounds) {
            ghost.setBounds(bounds);
        }
        const ai = ensureGhostAIInstance(ghost, index);
        ai.update(ghost, player, deltaTime, bounds, gameState, pathfinder);
        ghost.update(deltaTime);
    });
}

export default Ghost;
