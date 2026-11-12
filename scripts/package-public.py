"""Build a public source snapshot with a small, explicit allowlist. Never uploads."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / 'insightflow-public-source.zip'
root_files = {
    '.env.example', '.gitattributes', '.gitignore', 'AGENTS.md', 'LICENSE',
    'README.md', 'README.en.md', 'README_zh-CN.md', 'CONTRIBUTING.md',
    'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'Start-InsightFlow.cmd',
    'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'components.json',
    'eslint.config.mjs', 'next-env.d.ts', 'next.config.ts', 'playwright.config.ts',
    'postcss.config.mjs', 'proxy.ts', 'tsconfig.json',
}
public_docs = {
    'docs/DEVELOPMENT.md', 'docs/ARCHITECTURE.md', 'docs/DEPLOYMENT.md',
    'docs/KNOWN-ISSUES.md', 'docs/OPEN-SOURCE.md', 'docs/licenses.json',
    'docs/licenses-lock.json', 'docs/LICENSE-AUDIT.md', 'docs/RELEASE-v0.1.0.md',
    'docs/TEST-V0.1.md', 'docs/social-preview.svg', 'docs/social-preview.png',
    'docs/screenshots/home.png', 'docs/screenshots/home-mobile.png',
    'docs/screenshots/public-preview.png', 'docs/screenshots/public-preview-mobile.png',
    '.github/workflows/ci.yml',
    '.github/ISSUE_TEMPLATE/bug_report.yml', '.github/ISSUE_TEMPLATE/feature_request.yml',
}
source_dirs = {'app', 'components', 'lib', 'local', 'scripts', 'supabase', 'tests'}
source_suffixes = {'.ts', '.tsx', '.mjs', '.css', '.sql', '.toml', '.yaml', '.yml', '.sh', '.py'}
names = subprocess.check_output(
    ['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root
).decode().split('\0')
files = []
for name in sorted(set(filter(None, names))):
    relative = Path(name)
    if name in root_files or name in public_docs or (
        relative.parts[0] in source_dirs and relative.suffix in source_suffixes
        and not any(part.startswith('.') for part in relative.parts)
    ):
        path = root / relative
        if path.is_file() and not path.is_symlink():
            files.append((name, path))
required = {'README.md', '.env.example', 'package.json', 'compose.yaml',
            'app/demo/page.tsx', 'docs/screenshots/public-preview.png'}
# Compose is a root runtime definition, not a user's runtime data.
files.append(('compose.yaml', root / 'compose.yaml'))
assert required.issubset({name for name, _ in files}), 'Required public files missing'
secrets = []
for config in ['.env.local', 'local/runtime.env']:
    path = root / config
    if path.exists():
        for line in path.read_text(encoding='utf-8').splitlines():
            key, _, value = line.partition('=')
            value = value.strip().strip('\"\'')
            if len(value) > 16 and any(word in key for word in ['KEY', 'SECRET', 'TOKEN', 'PASSWORD']):
                secrets.append(value.encode())
accounts = root / 'tests/.accounts.json'
if accounts.exists():
    secrets.extend(user['password'].encode() for user in json.loads(accounts.read_text()))
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, path in files:
        data = path.read_bytes()
        assert not any(secret in data for secret in secrets), 'Private credential found: ' + name
        assert not re.search(rb'gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}', data), 'Credential pattern: ' + name
        z.writestr('insightflow/' + name, data)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(digest + '  ' + archive.name + '\n')
print(json.dumps({'archive': str(archive), 'files': len(files), 'sha256': digest,
                  'verified': True, 'uploaded': False}, indent=2))
