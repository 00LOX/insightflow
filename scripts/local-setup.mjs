import {existsSync,writeFileSync,readFileSync,chmodSync} from 'node:fs';
import {randomBytes,createHmac} from 'node:crypto';
chmodSync('local/init.sql',0o644);chmodSync('local/kong.yml',0o644);
let secret;
if(existsSync('local/runtime.env')){
 const runtime=readFileSync('local/runtime.env','utf8');secret=runtime.match(/^GOTRUE_JWT_SECRET=(.+)$/m)?.[1]?.trim();
 if(!secret||runtime.match(/^PGRST_JWT_SECRET=(.+)$/m)?.[1]?.trim()!==secret)throw new Error('Local JWT settings are missing or inconsistent. Preserve this file and inspect configuration.');
}else{
 secret=randomBytes(32).toString('hex');writeFileSync('local/runtime.env',`GOTRUE_JWT_SECRET=${secret}\nPGRST_JWT_SECRET=${secret}\n`,{mode:0o600});
}
// Database passwords are generated locally, never shipped in Compose or SQL.
let runtime=readFileSync('local/runtime.env','utf8');
let databasePassword=runtime.match(/^POSTGRES_PASSWORD=(.+)$/m)?.[1]?.trim();
if(!databasePassword){databasePassword=randomBytes(32).toString('hex');runtime+=`POSTGRES_PASSWORD=${databasePassword}\n`;}
for(const [key,value] of [['GOTRUE_DB_DATABASE_URL',`postgres://supabase_auth_admin:${databasePassword}@db:5432/postgres?search_path=auth`],['PGRST_DB_URI',`postgres://authenticator:${databasePassword}@db:5432/postgres`]]){
 const pattern=new RegExp(`^${key}=.*$`,'m');runtime=pattern.test(runtime)?runtime.replace(pattern,`${key}=${value}`):runtime+`${key}=${value}\n`;
}
if(runtime!==readFileSync('local/runtime.env','utf8'))writeFileSync('local/runtime.env',runtime,{mode:0o600});
const jwt=(role)=>{const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const payload=Buffer.from(JSON.stringify({iss:'supabase-local',role,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+10*365*86400})).toString('base64url');const content=header+'.'+payload;return content+'.'+createHmac('sha256',secret).update(content).digest('base64url')};
const isNew=!existsSync('.env.local');let config=readFileSync(isNew?'.env.example':'.env.local','utf8');
const url=config.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'');
if(/^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(url??'')){
 for(const [key,role] of [['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','anon'],['SUPABASE_SERVICE_ROLE_KEY','service_role']]){
  const blank=new RegExp(`^${key}=[ \\t]*(?:""|'')?[ \\t]*$`,'m');config=config.replace(blank,key+'='+jwt(role));
 }
}
if(isNew||config!==readFileSync('.env.local','utf8'))writeFileSync('.env.local',config,{mode:0o600});
console.log('Local configuration ready. Existing keys and non-empty settings preserved.');
