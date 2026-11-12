"""Create and verify source-only ZIP; never bundle secrets or database contents."""
from pathlib import Path
import zipfile,hashlib,json,os
root=Path(__file__).resolve().parents[1]
out=root/'dist';out.mkdir(exist_ok=True)
archive=out/'insightflow-v1.1-source.zip'
excluded={'node_modules','.next','.git','dist','backups','playwright-report','test-results','.temp','.branches','__pycache__'}
files=[]
for folder,dirs,names in os.walk(root):
 dirs[:]=[d for d in dirs if d not in excluded]
 for name in sorted(names):
  p=Path(folder)/name;r=p.relative_to(root)
  if p.is_symlink() or (name.startswith('.env') and name!='.env.example') or name in {'runtime.env','.accounts.json'} or name.endswith(('.tsbuildinfo','.log','.dump','.partial')):continue
  files.append(p)
required=['package.json','pnpm-lock.yaml','.env.example','README.md','LICENSE','docs/DEVELOPMENT.md','docs/DEPLOYMENT.md']
assert all(root/r in files for r in required),'Missing required deliverable'
json.loads((root/'docs/licenses.json').read_text())
secrets=[]
for env in [root/'.env.local',root/'local/runtime.env']:
 if env.exists():
  for line in env.read_text().splitlines():
   if '=' in line:
    key,value=line.split('=',1)
    if value and len(value)>20 and any(k in key for k in ['KEY','SECRET']):secrets.append(value.encode())
if (root/'tests/.accounts.json').exists():
 for user in json.loads((root/'tests/.accounts.json').read_text()):secrets.append(user['password'].encode())
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(files):
  data=p.read_bytes()
  assert not any(s in data for s in secrets),f'Secret found in {p.relative_to(root)}'
  z.write(p,'insightflow/'+str(p.relative_to(root)))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert all('insightflow/'+r in z.namelist() for r in required)
 for name in z.namelist():
  parts=Path(name).parts
  assert not any(p in excluded for p in parts)
  assert '..' not in parts
checksum=hashlib.sha256(archive.read_bytes()).hexdigest()
(archive.with_suffix('.zip.sha256')).write_text(checksum+'  '+archive.name+'\n')
print(json.dumps({'archive':str(archive),'files':len(files),'bytes':archive.stat().st_size,'sha256':checksum,'verified':True},indent=2))
