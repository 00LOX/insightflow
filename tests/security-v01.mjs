import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';

const base=process.env.TEST_BASE_URL??'http://localhost:3000';
const accounts=JSON.parse(readFileSync('tests/.accounts.json','utf8'));
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
let checks=0;const pass=label=>{checks++;console.log('PASS',label)};
async function login(account){const jar=new Map();const client=createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>jar.set(name,value))}});assert.ifError((await client.auth.signInWithPassword({email:account.email,password:account.password})).error);return {client,cookie:[...jar].map(([n,v])=>n+'='+v).join('; ')}}
const [a,b]=await Promise.all(accounts.map(login));
async function call(path,method='GET',body,cookie=a.cookie,origin=base,target=base){const r=await fetch(target+'/api/'+path,{method,headers:{cookie,origin,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const publicResponse=await fetch(base+'/api/public/feed');const feed=await publicResponse.json();assert.equal(publicResponse.status,200);assert.ok(feed.articles.length);const article=feed.articles[0];
const fields=['id','title','excerpt','url','published_at','updated_at','fetched_at','source_names'];assert.ok(feed.articles.every(x=>Object.keys(x).every(k=>fields.includes(k))));assert.ok(!JSON.stringify(feed).includes(process.env.SUPABASE_SERVICE_ROLE_KEY));pass('游客读取真实来源，响应仅含公开字段');
assert.equal((await call('bootstrap','GET',undefined,'')).status,401);pass('游客不能读取私人引导数据');
const guest=await call('ai','POST',{kind:'summary',resource_id:article.id,key:crypto.randomUUID()},'');assert.equal(guest.status,401);pass('游客 AI 被服务端要求登录，不发付费调用');
assert.equal((await call('saved','POST',{article_id:article.id,saved:true},a.cookie,'https://untrusted.example')).status,403);pass('跨站写入拒绝');
const initialA=(await call('bootstrap')).data,initialB=(await call('bootstrap','GET',undefined,b.cookie)).data;
try{
 assert.equal((await call('preferences','PATCH',{timezone:'UTC',user_id:accounts[1].id})).status,400);
 assert.equal((await call('preferences','PATCH',{timezone:'UTC'})).status,200);
 assert.equal((await call('bootstrap','GET',undefined,b.cookie)).data.preferences.timezone,initialB.preferences.timezone);pass('偏好只修改当前账号，伪造 user_id 被拒绝');
 const beforeA=(await call('feeds')).data.saved.includes(article.id);const beforeB=(await call('feeds','GET',undefined,b.cookie)).data.saved;
 try{assert.equal((await call('saved','POST',{article_id:article.id,saved:true})).status,200);assert.ok((await call('feeds')).data.saved.includes(article.id));assert.deepEqual((await call('feeds','GET',undefined,b.cookie)).data.saved,beforeB);pass('公开文章可私有收藏，跨用户隔离')}finally{await call('saved','POST',{article_id:article.id,saved:beforeA})}
 const created=await call('ideas','POST',{title:'V0.1隔离测试夹具',notes:'测试结束清理，不调用真实模型'});assert.equal(created.status,200);
 try{const rows=await b.client.from('ideas').select('id').eq('id',created.data.id);assert.ifError(rows.error);assert.equal(rows.data.length,0);const before=await admin.from('ai_operations').select('id',{count:'exact',head:true}).eq('user_id',accounts[1].id);assert.equal((await call('ai','POST',{kind:'idea',resource_id:created.data.id,key:crypto.randomUUID()},b.cookie)).status,400);const after=await admin.from('ai_operations').select('id',{count:'exact',head:true}).eq('user_id',accounts[1].id);assert.equal(after.count,before.count);pass('Idea 越权分析在模型调用前被拒绝')}finally{await call('ideas/'+created.data.id,'DELETE',{})}
}finally{await call('preferences','PATCH',{timezone:initialA.preferences.timezone})}
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3001'],{env:{...process.env,AI_API_KEY:'',NEXT_PUBLIC_APP_URL:'http://localhost:3001'},stdio:'ignore',windowsHide:true});
try{
 let ready=false;for(let i=0;i<40;i++){try{if((await fetch('http://localhost:3001',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}assert.ok(ready,'No-key test server ready');
 const noKeyFeed=await (await fetch('http://localhost:3001/api/public/feed')).json();assert.equal(noKeyFeed.aiEnabled,false);
 const before=await admin.from('ai_operations').select('id',{count:'exact',head:true}).eq('user_id',accounts[0].id);
 const result=await call('ai','POST',{kind:'summary',resource_id:article.id,key:crypto.randomUUID()},a.cookie,'http://localhost:3001','http://localhost:3001');assert.equal(result.status,200);assert.equal(result.data.demo,true);assert.match(result.data.message,/AI 未配置/);
 const after=await admin.from('ai_operations').select('id',{count:'exact',head:true}).eq('user_id',accounts[0].id);assert.equal(after.count,before.count);pass('无 Key 降级不写分析、不预留额度、不调用模型');
}finally{child.kill()}
console.log(checks+' V0.1 security checks passed.');
