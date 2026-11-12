import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,writeFileSync,unlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const script=resolve('scripts/local-setup.mjs');
it('本地初始化可重入，丢失应用环境文件时复用旧Secret恢复',()=>{
 const root=mkdtempSync(join(tmpdir(),'insightflow-setup-'));
 try{mkdirSync(join(root,'local'));for(const name of ['init.sql','kong.yml'])copyFileSync('local/'+name,join(root,'local',name));copyFileSync('.env.example',join(root,'.env.example'));
 const run=()=>{const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});expect(r.status,r.stderr).toBe(0)};
 run();const env=readFileSync(join(root,'.env.local'),'utf8'),runtime=readFileSync(join(root,'local/runtime.env'),'utf8');expect(env).toMatch(/SUPABASE_SERVICE_ROLE_KEY=eyJ/);expect(runtime).toMatch(/^POSTGRES_PASSWORD=[a-f0-9]{64}$/m);run();expect(readFileSync(join(root,'.env.local'),'utf8')).toBe(env);
 unlinkSync(join(root,'.env.local'));run();expect(readFileSync(join(root,'local/runtime.env'),'utf8')).toBe(runtime);expect(readFileSync(join(root,'.env.local'),'utf8')).toMatch(/SUPABASE_SERVICE_ROLE_KEY=eyJ/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
it('本地启动不覆盖云端Supabase配置',()=>{
 const root=mkdtempSync(join(tmpdir(),'insightflow-cloud-config-'));
 try{mkdirSync(join(root,'local'));for(const name of ['init.sql','kong.yml'])copyFileSync('local/'+name,join(root,'local',name));copyFileSync('.env.example',join(root,'.env.example'));const config='NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=\nSUPABASE_SERVICE_ROLE_KEY=\n';writeFileSync(join(root,'.env.local'),config);
 const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});expect(r.status).toBe(0);expect(readFileSync(join(root,'.env.local'),'utf8')).toBe(config);
 }finally{rmSync(root,{recursive:true,force:true})}
});
