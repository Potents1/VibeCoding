import { defaultMaze } from './game_state.js';

const WALL = '#';
const DIRECTIONS = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
];

function normalizeMaze(maze) {
    if (!Array.isArray(maze) || maze.length === 0) {
        return normalizeMaze(defaultMaze);
    }
    const width = Math.max(...maze.map(row => row.length));
    return maze.map(row => row.padEnd(width, WALL));
}

function cellKey(col, row) {
    return `${col}:${row}`;
}

function clampCell(col, row, width, height) {
    const normalizedCol = Math.min(Math.max(col, 0), Math.max(0, width - 1));
    const normalizedRow = Math.min(Math.max(row, 0), Math.max(0, height - 1));
    return { col: normalizedCol, row: normalizedRow };
}

function worldToCell(point, cellSize, width, height) {
    if (!point) {
        return null;
    }
    if (Number.isFinite(point.col) && Number.isFinite(point.row)) {
        return clampCell(point.col, point.row, width, height);
    }
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
    }
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (col < 0 || row < 0 || col >= width || row >= height) {
        return null;
    }
    return { col, row };
}

class GridPathfinder {
    constructor({ maze = defaultMaze, cellSize = 16 } = {}) {
        this.cellSize = Math.max(1, Number(cellSize) || 16);
        this.maze = normalizeMaze(maze);
        this.height = this.maze.length;
        this.width = this.maze[0]?.length ?? 0;
    }

    isWalkable(col, row) {
        if (!Number.isInteger(col) || !Number.isInteger(row)) {
            return false;
        }
        if (col < 0 || row < 0 || col >= this.width || row >= this.height) {
            return false;
        }
        return this.maze[row][col] !== WALL;
    }

    toCell(point) {
        return worldToCell(point, this.cellSize, this.width, this.height);
    }

    cellCenter(col, row) {
        return {
            x: col * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2,
        };
    }

    findPath(start, target) {
        const startCell = this.toCell(start);
        const targetCell = this.toCell(target);
        if (!startCell || !targetCell) {
            return [];
        }
        const startKey = cellKey(startCell.col, startCell.row);
        const targetKey = cellKey(targetCell.col, targetCell.row);
        const queue = [startCell];
        const parents = new Map();
        const cells = new Map([[startKey, startCell]]);

        while (queue.length > 0) {
            const current = queue.shift();
            const currentKey = cellKey(current.col, current.row);
            if (currentKey === targetKey) {
                break;
            }
            for (const { dc, dr } of DIRECTIONS) {
                const nextCol = current.col + dc;
                const nextRow = current.row + dr;
                if (!this.isWalkable(nextCol, nextRow)) {
                    continue;
                }
                const nextKey = cellKey(nextCol, nextRow);
                if (cells.has(nextKey)) {
                    continue;
                }
                const nextCell = { col: nextCol, row: nextRow };
                parents.set(nextKey, currentKey);
                cells.set(nextKey, nextCell);
                queue.push(nextCell);
            }
        }

        if (!cells.has(targetKey)) {
            return [];
        }

        const path = [];
        let currentKey = targetKey;
        while (currentKey !== startKey) {
            const cell = cells.get(currentKey);
            if (!cell) {
                return [];
            }
            path.push(this.cellCenter(cell.col, cell.row));
            const parentKey = parents.get(currentKey);
            if (!parentKey) {
                break;
            }
            currentKey = parentKey;
        }
        path.reverse();
        return path;
    }
}

export function initPathfinding(options) {
    return new GridPathfinder(options);
}

const sharedPathfinder = initPathfinding();

export function findPath(start, target, options = {}) {
    const { pathfinder, maze, cellSize } = options;
    if (!start || !target) {
        return [];
    }
    if (pathfinder instanceof GridPathfinder) {
        return pathfinder.findPath(start, target);
    }
    if (maze) {
        return new GridPathfinder({ maze, cellSize }).findPath(start, target);
    }
    return sharedPathfinder.findPath(start, target);
}

export { GridPathfinder };
