import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
proc = subprocess.run([sys.executable, str(ROOT / 'task_impl.py')], capture_output=True, text=True)
print(proc.stdout.strip())
assert proc.returncode == 0
assert 'Implemented task:' in proc.stdout
print('SMOKE_OK')
