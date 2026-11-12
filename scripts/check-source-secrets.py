"""Scan source, reachable history and build files; never print secret values."""
from pathlib import Path
import argparse,base64,json,os,re,subprocess
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--history',action='store_true')
parser.add_argument('--build',action='store_true')
args=parser.parse_args()
def git(*parts):return subprocess.check_output(['git',*parts],cwd=root)
secrets,private=[],[]
for name in ['.env.local','local/runtime.env']:
 p=root/name
 if p.exists():
  for line in p.read_text(encoding='utf-8').splitlines():
   key,_,value=line.partition('=');value=value.strip().strip('\"\'')
   if any(word in key for word in ['KEY','SECRET','TOKEN','PASSWORD']) and len(value)>16:
    secrets.append(value.encode())
    if not key.startswith('NEXT_PUBLIC_'):private.append(value.encode())
p=root/'tests/.accounts.json'
if p.exists():private.extend(a['password'].encode() for a in json.loads(p.read_text()))
for key in ['GH_TOKEN','GITHUB_TOKEN','AI_API_KEY']:
 if len(os.environ.get(key,''))>16:private.append(os.environ[key].encode())
secrets.extend(private)
pattern=re.compile(rb'(?<![A-Za-z0-9_])(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
def scan(data,label,values):
 if any(value in data for value in values) or pattern.search(data):raise SystemExit('FAIL credential in: '+label)
 for token in re.findall(rb'eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]{20,}',data):
  try:
   if json.loads(base64.urlsafe_b64decode(token+b'='*(-len(token)%4))).get('role')=='service_role':raise SystemExit('FAIL service-role JWT in: '+label)
  except (ValueError,UnicodeError):pass
forbidden={'node_modules','.next','.git','backups','dist','test-results','playwright-report','.temp','.branches','.credentials'}
def check_path(name):
 p=Path(name)
 if any(part in forbidden for part in p.parts) or (p.name.startswith('.env') and p.name!='.env.example') or p.name in {'runtime.env','.accounts.json'} or p.suffix in {'.pem','.key','.p12','.pfx','.dump','.log','.partial'}:raise SystemExit('FAIL forbidden runtime path: '+name)
names=git('ls-files','--cached','--others','--exclude-standard','-z').decode().split('\0')
count=0
for name in sorted(set(filter(None,names))):
 p=root/name
 if p.is_file():
  check_path(name);scan(p.read_bytes(),name,secrets);count+=1
print(f'PASS source: {count} Git candidates; no known credentials or forbidden runtime files.')
if args.history:
 blobs=0
 for line in git('rev-list','--objects','--all').decode().splitlines():
  oid,_,name=line.partition(' ')
  if git('cat-file','-t',oid).strip()!=b'blob':continue
  check_path(name);scan(git('cat-file','blob',oid),'Git blob '+oid[:12],secrets);blobs+=1
 print(f'PASS history: {blobs} reachable blobs; no known private keys, service-role JWTs or forbidden files.')
if args.build:
 build=root/'.next'
 if not (build/'BUILD_ID').exists():raise SystemExit('FAIL production build missing')
 files=0
 for p in build.rglob('*'):
  if p.is_file():scan(p.read_bytes(),str(p.relative_to(build)),private);files+=1
 print(f'PASS build: {files} files; no known private credentials. Public Supabase key is intentionally client-visible.')
