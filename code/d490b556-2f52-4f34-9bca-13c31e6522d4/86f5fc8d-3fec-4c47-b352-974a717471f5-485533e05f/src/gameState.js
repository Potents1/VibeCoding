export const pads = [
  { name: 'Red', color: '#d94f45', glow: '#ff8a80', key: 'q' },
  { name: 'Gold', color: '#d49b2d', glow: '#ffd166', key: 'w' },
  { name: 'Teal', color: '#2b9a8d', glow: '#64dfd1', key: 'a' },
  { name: 'Blue', color: '#4769c9', glow: '#8ea4ff', key: 's' }
];

export function createRng(seed = 0xdecafbad) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export function createGame(seed = 0xdecafbad) {
  return {
    best: 0,
    inputIndex: 0,
    mode: 'idle',
    rng: createRng(seed),
    round: 0,
    score: 0,
    sequence: [],
    status: 'Press Start to receive the first signal.'
  };
}

export function startRound(game) {
  game.round += 1;
  game.inputIndex = 0;
  game.mode = 'showing';
  game.sequence.push(Math.floor(game.rng() * pads.length));
  game.status = `Watch round ${game.round}.`;
  return game.sequence.at(-1);
}

export function beginInput(game) {
  game.inputIndex = 0;
  game.mode = 'input';
  game.status = `Repeat ${game.round} signal${game.round === 1 ? '' : 's'}.`;
}

export function handlePad(game, padIndex) {
  if (game.mode !== 'input') {
    return { accepted: false, result: game.mode };
  }

  const expected = game.sequence[game.inputIndex];
  if (padIndex !== expected) {
    game.mode = 'lost';
    game.status = `Lost on round ${game.round}. Press Start to try again.`;
    game.best = Math.max(game.best, game.score);
    return { accepted: true, result: 'lost', expected };
  }

  game.inputIndex += 1;
  game.score += 10;
  game.best = Math.max(game.best, game.score);

  if (game.inputIndex === game.sequence.length) {
    game.mode = 'won';
    game.status = `Round ${game.round} complete.`;
    return { accepted: true, result: 'won' };
  }

  game.status = `${game.sequence.length - game.inputIndex} remaining.`;
  return { accepted: true, result: 'progress' };
}

export function resetGame(game, seed = 0xdecafbad) {
  const best = game.best;
  Object.assign(game, createGame(seed), { best });
}
