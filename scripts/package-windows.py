"""Package compiled assets only. Run after npm run build and build:standalone."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
output = root / 'work'
standalone = output / 'windows-release' / 'BookTrip.html'
assert standalone.is_file(), 'Run npm run build:standalone first'
assert (root / 'dist/index.html').is_file(), 'Run npm run build first'
staging = output / 'windows-distribution'
staging.mkdir(parents=True, exist_ok=True)
shutil.copy2(standalone, staging / 'BookTrip.html')
for filename in ['README-Windows.md', 'THIRD-PARTY-NOTICES.txt']:
    shutil.copy2(root / filename, staging / filename)
shutil.copytree(root / 'dist', staging / 'web', dirs_exist_ok=True)
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
(staging / 'BUILD-INFO.json').write_text(json.dumps({
    'application': 'BookTrip', 'release': 'v0.1.0-windows', 'sourceCommit': commit,
    'build': 'npm run build && npm run build:standalone',
    'windowsRequiresNodeOrNpm': False,
    'verification': 'Chromium: HTTP standalone; offline itinerary edits. Windows Edge and file URL not verified.'
}, indent=2) + '\n')
files = sorted(p for p in staging.rglob('*') if p.is_file() and p.name != 'SHA256SUMS.txt')
checksums = '\n'.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(staging).as_posix()}' for p in files)
(staging / 'SHA256SUMS.txt').write_text(checksums + '\n')
archive = output / 'BookTrip-Windows-Built-v0.1.0.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(staging.rglob('*')):
        if p.is_file():
            z.write(p, p.relative_to(staging))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    names = z.namelist()
    assert all(not set(Path(name).parts) & {'src', 'node_modules', '.git', 'dist'} for name in names)
    assert not any(Path(name).name.startswith('.env') for name in names)
    assert 'BookTrip.html' in names and 'web/index.html' in names
    assert not any(Path(name).suffix.lower() in {'.exe', '.dll', '.node'} for name in names)
sha256 = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / 'BookTrip-Windows-Built-v0.1.0.zip.sha256').write_text(f'{sha256}  {archive.name}\n')
print(json.dumps({'zip': str(archive), 'bytes': archive.stat().st_size, 'sha256': sha256, 'sourceCommit': commit, 'files': len(names)}, indent=2))
