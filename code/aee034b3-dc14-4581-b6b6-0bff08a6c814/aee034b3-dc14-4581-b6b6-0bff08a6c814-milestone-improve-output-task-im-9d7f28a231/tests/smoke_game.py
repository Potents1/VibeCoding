from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
index_raw = (root / 'index.html').read_text(encoding='utf-8', errors='ignore')
index = index_raw.lower()
scripts = re.findall(r'<script\b([^>]*)>', index_raw, flags=re.IGNORECASE | re.DOTALL)
module_src = ''
for attrs in scripts:
    if re.search(r'\btype\s*=\s*["\']module["\']', attrs, flags=re.IGNORECASE):
        match = re.search(r'\bsrc\s*=\s*["\']([^"\']+)["\']', attrs, flags=re.IGNORECASE)
        if match:
            module_src = match.group(1).split('?', 1)[0].split('#', 1)[0].strip().lstrip('/')
            break
assert module_src, 'index.html must load an esm module script with src'
assert module_src.startswith('src/') and '..' not in Path(module_src).parts, 'browser entrypoint must be under src/'
game_path = root / module_src
assert game_path.exists(), f'missing browser entrypoint {module_src}'
game = game_path.read_text(encoding='utf-8', errors='ignore').lower()
src_corpus = '\n'.join(p.read_text(encoding='utf-8', errors='ignore').lower() for p in (root / 'src').glob('*.js'))
corpus = index + '\n' + src_corpus
assert 'type="module"' in index or "type='module'" in index, 'index.html must load an esm module'
has_progression = any(token in src_corpus for token in ('requestanimationframe', 'setinterval(', 'update(', 'tick(', 'step(', 'render(', 'renderboard', 'onsquareclick', 'movepiece', 'makemove', '.move('))
assert has_progression, 'missing game progression loop or turn handler'
assert 'keydown' in src_corpus or 'keyup' in src_corpus or 'pointerdown' in src_corpus or 'click' in src_corpus or 'input' in src_corpus, 'missing input handling'
assert 'canvas' in corpus or 'board' in corpus, 'missing primary game surface'
assert 'won' in src_corpus or 'lost' in src_corpus or 'gameover' in src_corpus or 'status' in src_corpus or 'turn' in src_corpus or 'score' in src_corpus or 'health' in src_corpus, 'missing game state'
assert 'require(' not in game and 'module.exports' not in game, 'commonjs is not allowed in browser esm stack'
assert (root / 'task_impl.py').exists() is False
assert (root / 'smoke_test.py').exists() is False
print('SMOKE_GAME_OK')
