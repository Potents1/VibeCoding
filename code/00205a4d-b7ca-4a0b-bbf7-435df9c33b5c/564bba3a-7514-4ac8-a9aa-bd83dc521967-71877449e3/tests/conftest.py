from pathlib import Path
import shutil
import sys

import tempfile
import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture
def tmp_path():
    candidates = [
        Path.home() / 'source' / 'repos' / 'AGI' / '.pytest_tmp_manual',
        Path(tempfile.gettempdir()),
    ]
    for base in candidates:
        try:
            base.mkdir(parents=True, exist_ok=True)
            path = Path(tempfile.mkdtemp(prefix='artifact_', dir=str(base)))
            yield path
            shutil.rmtree(path, ignore_errors=True)
            return
        except PermissionError:
            continue
    raise RuntimeError('no writable temporary directory available for tests')
