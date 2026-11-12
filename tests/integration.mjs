import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync,existsSync,readFileSync} from 'node:fs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const phase=process.env.TEST_PHASE??'A';let checks=0;
function ok(value,label){assert.ok(value,label);console.log('PASS',label);checks++}
let accounts;
if(existsSync('tests/.accounts.json'))accounts=JSON.parse(readFileSync('tests/.accounts.json','utf8'));else{accounts=[];for(let i=0;i<2;i++){const email=`test-${Date.now()}-${i}@example.com`,password=randomUUID()+'Aa1!';const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(error);accounts.push({id:data.user.id,email,password})}writeFileSync('tests/.accounts.json',JSON.stringify(accounts),{mode:0o600})}
const clients=[];for(const a of accounts){const db=createClient(url,key,{auth:{persistSession:false}});const {data,error}=await db.auth.signInWithPassword(a);assert.ifError(error);ok(data.session,'真实 Supabase Auth 登录');clients.push(db)}
const [a,b]=clients;const source='11111111-1111-4111-8111-111111111111';
const topic={user_id:accounts[0].id,name:'GitHub 开源动态',keywords:[],excluded:[],source_ids:[source],timezone:'Asia/Shanghai',start_hour:0,end_hour:23,frequency:'daily',brief_time:'09:00'};
let {data:t}=await a.from('topics').select('*').eq('name',topic.name).limit(1).maybeSingle();if(!t){const r=await a.from('topics').insert(topic).select().single();assert.ifError(r.error);t=r.data}ok(t.id,'主题保存并持久化');
const {data:other,error:otherError}=await b.from('topics').select('*').eq('id',t.id);assert.ifError(otherError);ok(other.length===0,'账号B无法读取账号A主题');
const denied=await b.from('topics').update({name:'越权'}).eq('id',t.id).select();ok(!denied.data?.length,'账号B无法修改账号A主题');
const cross=await b.from('topics').insert({...topic,name:'越权创建'});ok(cross.error,'不能伪造其他用户ID创建主题');
const anon=createClient(url,key,{auth:{persistSession:false}});const privateRead=await anon.from('topics').select('*');ok(privateRead.error,'未登录无法读取私人表');
const subscriptionWrite=await a.from('subscriptions').update({plan:'pro'}).eq('user_id',accounts[0].id);ok(subscriptionWrite.error,'浏览器不能自助升级套餐');
const rpc=await a.rpc('reserve_ai',{p_user:accounts[0].id,p_key:randomUUID(),p_kind:'summary',p_resource:randomUUID(),p_model:'test'});ok(rpc.error,'浏览器不能直接预留AI额度');
const sources=await a.from('sources').select('*');assert.ifError(sources.error);ok(sources.data.length===1,'可信来源目录可用');
if(phase==='A'){
 const res=await fetch('https://github.blog/feed/',{signal:AbortSignal.timeout(15000),redirect:'error'});ok(res.ok&&(await res.text()).includes('<rss'),'真实官方RSS读取');
}
if(phase==='D'){
 let idea=await a.from('ideas').select('*').eq('title','隔离测试 Idea').maybeSingle();if(!idea.data)idea=await a.from('ideas').insert({user_id:accounts[0].id,title:'隔离测试 Idea',notes:'仅测试笔记'}).select().single();assert.ifError(idea.error);
 const otherIdea=await b.from('ideas').select('*').eq('id',idea.data.id);ok(!otherIdea.data.length,'Idea 跨用户读取隔离');
 const resource=randomUUID();const ops=await Promise.all(Array.from({length:8},()=>admin.rpc('reserve_ai',{p_user:accounts[1].id,p_key:randomUUID(),p_kind:'summary',p_resource:resource,p_model:'quota-test'})));const accepted=ops.filter(x=>!x.error);ok(accepted.length===3,'8个并发请求最多接受3个免费摘要');
 const first=accepted[0].data;const duplicate=await admin.rpc('reserve_ai',{p_user:accounts[1].id,p_key:first.idempotency_key,p_kind:'summary',p_resource:resource,p_model:'quota-test'});ok(duplicate.data.id===first.id,'重复幂等标识复用同一预留');
 const claims=await Promise.all([admin.rpc('claim_ai',{p_operation:first.id}),admin.rpc('claim_ai',{p_operation:first.id})]);ok(claims.filter(c=>c.data===true).length===1,'并发幂等请求仅允许一次模型调用');
 for(const item of accepted){const r=await admin.rpc('settle_ai',{p_operation:item.data.id,p_result:{},p_prompt:null,p_completion:null,p_error:'集成测试故障注入：未调用模型'});assert.ifError(r.error)}
 const next=await admin.rpc('reserve_ai',{p_user:accounts[1].id,p_key:randomUUID(),p_kind:'summary',p_resource:resource,p_model:'recovery-test'});ok(!next.error,'失败请求释放额度');
 const aged=await admin.from('ai_operations').update({created_at:new Date(Date.now()-6*60000).toISOString()}).eq('id',next.data.id);assert.ifError(aged.error);
 const retry=await admin.rpc('reserve_ai',{p_user:accounts[1].id,p_key:randomUUID(),p_kind:'summary',p_resource:resource,p_model:'recovery-test'});assert.ifError(retry.error);const stale=await admin.from('ai_operations').select('status').eq('id',next.data.id).single();ok(stale.data.status==='failed','中断预留超过5分钟自动回收');
 await admin.rpc('settle_ai',{p_operation:retry.data.id,p_result:{},p_prompt:null,p_completion:null,p_error:'测试结束'});
 const fake=await b.from('usage_records').insert({user_id:accounts[0].id,operation_id:randomUUID(),kind:'idea'});ok(fake.error,'不能伪造额度使用记录');
 const hidden=await b.from('ai_operations').select('*').eq('user_id',accounts[0].id);ok(hidden.data.length===0,'AI日志跨用户隔离');
 const sub=await a.from('subscriptions').select('plan').single();ok(sub.data.plan==='free','套餐保持Free');
 const limits=await a.from('topics').select('id');const needed=3-limits.data.length;for(let i=0;i<needed;i++){const x=await a.from('topics').insert({...topic,name:'配额测试主题'+i});assert.ifError(x.error)}const excess=await a.from('topics').insert({...topic,name:'超过上限'});ok(excess.error,'数据库直接写入也无法绕过主题上限');
 // Remove only the test-created quota fixtures, leaving the main test topic intact.
 await a.from('topics').delete().eq('user_id',accounts[0].id).like('name','配额测试主题%');
}
const logout=await b.auth.signOut();assert.ifError(logout.error);const after=await b.from('ideas').select('*');ok(after.error,'退出后私人数据不可读');
console.log(`Phase ${phase}: ${checks} checks passed.`);
