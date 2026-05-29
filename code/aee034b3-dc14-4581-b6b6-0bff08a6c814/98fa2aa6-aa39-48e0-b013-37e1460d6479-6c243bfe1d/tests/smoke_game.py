from pathlib import Path

root = Path(__file__).resolve().parents[1]
required = [
    root / 'index.html',
    root / 'package.json',
    root / 'src' / 'game.js',
    root / 'src' / 'styles.css',
]
missing = [str(path.relative_to(root)) for path in required if not path.exists()]
assert not missing, f'Missing browser game files: {missing}'
print('SMOKE_GAME_OK')
