from pathlib import Path
root = Path(__file__).resolve().parents[1]
index = (root / 'index.html').read_text(encoding='utf-8', errors='ignore').lower()
game_path = root / 'src' / 'game.js'
assert game_path.exists(), 'missing src/game.js'
game = game_path.read_text(encoding='utf-8', errors='ignore').lower()
src_corpus = '\n'.join(p.read_text(encoding='utf-8', errors='ignore').lower() for p in (root / 'src').glob('*.js'))
corpus = index + '\n' + src_corpus
assert 'type="module"' in index or "type='module'" in index, 'index.html must load an esm module'
assert 'src/game.js' in index, 'index.html must load src/game.js'
has_progression = any(token in src_corpus for token in ('requestanimationframe', 'setinterval(', 'update(', 'tick(', 'step(', 'render(', 'renderboard', 'onsquareclick', 'movepiece', 'makemove', '.move('))
assert has_progression, 'missing game progression loop or turn handler'
assert 'keydown' in src_corpus or 'keyup' in src_corpus or 'pointerdown' in src_corpus or 'click' in src_corpus or 'input' in src_corpus, 'missing input handling'
assert 'canvas' in corpus or 'board' in corpus, 'missing primary game surface'
assert 'won' in src_corpus or 'lost' in src_corpus or 'gameover' in src_corpus or 'status' in src_corpus or 'turn' in src_corpus or 'score' in src_corpus or 'health' in src_corpus, 'missing game state'
assert 'require(' not in game and 'module.exports' not in game, 'commonjs is not allowed in browser esm stack'
assert (root / 'task_impl.py').exists() is False
assert (root / 'smoke_test.py').exists() is False
print('SMOKE_GAME_OK')
