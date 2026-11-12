// Cross-platform Docker database tools. No shell, curl, sed, or PowerShell binary redirection.
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const action=process.argv[2];
function docker(args,input){const r=spawnSync('docker',['compose','exec','-T','db',...args],{input,encoding:null,maxBuffer:64*1024*1024});if(r.error)throw r.error;if(r.status!==0)throw new Error(r.stderr?.toString()||'Docker database command failed');return r.stdout;}
function sql(text,database='postgres'){return docker(['psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1','-At'],text).toString();}
function migrations(){return readdirSync('supabase/migrations').filter(n=>/^\d+_[\w-]+\.sql$/.test(n)).sort();}
async function migrate(){
 let ready=false;
 for(let i=0;i<30;i++){try{const r=await fetch('http://127.0.0.1:54321/auth/v1/health',{signal:AbortSignal.timeout(2000)});if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,1000))}
 if(!ready)throw new Error('Auth not ready; run pnpm db:start and inspect docker compose logs auth');
 sql(`create or replace function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
 create table if not exists public.insightflow_migrations(name text primary key,applied_at timestamptz default now());alter table public.insightflow_migrations enable row level security;revoke all on public.insightflow_migrations from anon,authenticated;`);
 for(const name of migrations()){
  if(sql(`select count(*) from public.insightflow_migrations where name='${name}'`).trim()==='0'){
   console.log('Applying',name);sql(`begin;\n${readFileSync('supabase/migrations/'+name,'utf8')}\ninsert into public.insightflow_migrations(name) values('${name}');commit;`);
  }
 }
 sql("notify pgrst,'reload schema';");console.log('Migrations applied; existing user data preserved.');
}
function backup(){
 mkdirSync('backups',{recursive:true});const file=resolve('backups',`insightflow-${new Date().toISOString().replace(/[:.]/g,'-')}.dump`);
 const bytes=docker(['pg_dump','-U','postgres','-Fc','--schema=auth','--schema=public']);
 docker(['pg_restore','--list'],bytes);writeFileSync(file+'.partial',bytes,{mode:0o600});renameSync(file+'.partial',file);
 console.log('Verified backup:',file);console.log('Contains private data and authentication records. Excluded from Git and source ZIP.');
}
function verify(){
 const database='insightflow_verify_'+Date.now();sql(`create database ${database}`);
 const auth=docker(['pg_dump','-U','postgres','--schema=auth','--schema-only']).toString().replace(/^CREATE TRIGGER on_auth_user_created .*$/gm,'');
 sql(auth,database);for(const name of migrations())sql(`begin;\n${readFileSync('supabase/migrations/'+name,'utf8')}\ncommit;`,database);
 console.log('App tables:',sql("select count(*) from pg_tables where schemaname='public'",database).trim());
 console.log('Verified isolated schema:',database,'(working database unchanged)');
}
async function syncPassword(){
 const password=readFileSync('local/runtime.env','utf8').match(/^POSTGRES_PASSWORD=(.+)$/m)?.[1]?.trim();
 if(!password||!/^[a-f0-9]{64}$/.test(password))throw new Error('Generated database password missing or invalid.');
 let ready=false;
 for(let i=0;i<30;i++){try{if(sql("select count(*) from pg_roles where rolname in ('postgres','authenticator','supabase_auth_admin')").trim()==='3'){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,1000))}
 if(!ready)throw new Error('Local database roles not ready; inspect Docker startup without deleting the data volume.');
 sql(`alter role postgres with password '${password}';alter role authenticator with password '${password}';alter role supabase_auth_admin with password '${password}';`);
 console.log('Local database credentials synchronized; user data preserved.');
}
try{if(action==='sync-password')await syncPassword();else if(action==='migrate')await migrate();else if(action==='backup')backup();else if(action==='verify')verify();else throw new Error('Usage: node scripts/database.mjs migrate|backup|verify');}catch(e){console.error(e.message);process.exitCode=1;}
