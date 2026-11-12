import {NextRequest,NextResponse} from 'next/server';
import {sessionDb,adminDb} from '@/lib/supabase';
import {topicSchema,parseInterest,inHours} from '@/lib/rules';
import {readFeed,SOURCE_URLS} from '@/lib/rss';
import {OpenAICompatible,estimateCost} from '@/lib/ai';
import {z} from 'zod';
export const runtime='nodejs';
const uuid=z.string().uuid();
function check(error:unknown){if(error)throw new Error((error as {message?:string}).message??'数据库操作失败')}
async function handler(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){try{
 if(req.method!=='GET'){const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin&&origin!==process.env.NEXT_PUBLIC_APP_URL)return NextResponse.json({error:'不允许跨站写入'},{status:403});}
 const db=await sessionDb();const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'请先登录'},{status:401});
 const path=(await params).path;const resource=path[0],id=path[1];const admin=adminDb();
 let body:Record<string,unknown>={};
 if(req.method!=='GET'){const reader=req.body?.getReader();if(reader){let size=0;const chunks:Uint8Array[]=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>128*1024)throw new Error('请求内容超过128KB');chunks.push(value)}}finally{await reader.cancel()}body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('请求格式无效')}}
 const {data:subscription,error:se}=await db.from('subscriptions').select('plan').eq('user_id',user.id).single();check(se);
 const {data:limits,error:le}=await db.from('plan_limits').select('*').eq('plan',subscription?.plan??'free').single();check(le);
 const cutoff=new Date(Date.now()-(limits?.history??7)*86400000).toISOString();
 if(resource==='bootstrap'&&req.method==='GET'){
 const results=await Promise.all([db.from('topics').select('*').order('created_at',{ascending:false}),db.from('sources').select('*'),db.from('ideas').select('*').order('updated_at',{ascending:false}),db.from('usage_records').select('kind').gte('created_at',new Date().toISOString().slice(0,10)+'T00:00:00Z'),db.from('monitoring_runs').select('*').gte('created_at',cutoff).order('created_at',{ascending:false}).limit(10),db.from('ai_analyses').select('*').gte('created_at',cutoff).order('created_at',{ascending:false}).limit(50),db.from('profiles').select('timezone').eq('id',user.id).single()]);results.forEach(r=>check(r.error));return NextResponse.json({topics:results[0].data,sources:results[1].data,ideas:results[2].data,usage:results[3].data,runs:results[4].data,analyses:results[5].data,plan:subscription?.plan,limits,preferences:results[6].data,aiEnabled:!!process.env.AI_API_KEY});}
 if(resource==='preferences'&&req.method==='PATCH'){const value=z.object({timezone:z.string().max(100).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}},'无效时区')}).strict().parse(body);const result=await admin.from('profiles').update(value).eq('id',user.id).select('timezone').single();check(result.error);return NextResponse.json(result.data);}
 if(resource==='parse'&&req.method==='POST')return NextResponse.json(parseInterest(z.string().min(1).max(1000).parse(body.text)));
 if(resource==='topics'){
 if(req.method==='POST'&&!id){const value=topicSchema.parse(body);const {data:sources}=await db.from('sources').select('id');if(value.source_ids.some(s=>!sources?.some(x=>x.id===s)))throw new Error('请选择可信来源');const result=await db.from('topics').insert({...value,user_id:user.id}).select().single();check(result.error);await admin.from('product_events').insert({user_id:user.id,event:'topic_created'});return NextResponse.json(result.data);}
 if(id)uuid.parse(id);
 if(req.method==='PATCH'){const value=topicSchema.parse(body);const {data:sources}=await db.from('sources').select('id');if(value.source_ids.some(s=>!sources?.some(x=>x.id===s)))throw new Error('请选择可信来源');const result=await db.from('topics').update(value).eq('id',id).eq('user_id',user.id).select().single();check(result.error);return NextResponse.json(result.data);}
 if(req.method==='DELETE'){const r=await db.from('topics').delete().eq('id',id).eq('user_id',user.id);check(r.error);return NextResponse.json({ok:true});}
 }
 if(resource==='refresh'&&req.method==='POST'){
 const topicId=uuid.parse(body.topic_id);const {data:topic,error}=await db.from('topics').select('*').eq('id',topicId).eq('user_id',user.id).single();check(error);
 const from=body.from?z.iso.datetime().parse(body.from):cutoff;const to=body.to?z.iso.datetime().parse(body.to):new Date().toISOString();if(from>to)throw new Error('起始时间不得晚于结束时间');
 const {data:run,error:runError}=await admin.rpc('start_monitoring',{p_user:user.id,p_topic:topicId});check(runError);

 const {data:sources,error:srcError}=await db.from('sources').select('*').in('id',topic.source_ids);check(srcError);let count=0;const errors:string[]=[];
 for(const source of sources??[]){try{
 const claim=await admin.rpc('claim_source',{p_source:source.id});check(claim.error);if(!claim.data)throw new Error('来源访问频率受限，请稍后重试');const items=await readFeed(source.url);for(const item of items){const {data:article,error:ae}=await admin.from('articles').upsert(item,{onConflict:'url'}).select('id').single();check(ae);if(!article)throw new Error('文章写入失败');const ar=await admin.from('article_sources').upsert({article_id:article.id,source_id:source.id});check(ar.error);
 const text=`${item.title} ${item.excerpt}`.toLowerCase();if(item.published_at&&item.published_at>=from&&item.published_at<=to&&inHours(item.published_at,topic.timezone,topic.start_hour,topic.end_hour)&&(!topic.keywords.length||topic.keywords.some((k:string)=>text.includes(k.toLowerCase())))&&!topic.excluded.some((k:string)=>text.includes(k.toLowerCase()))){const link=await admin.from('topic_articles').upsert({topic_id:topic.id,article_id:article.id},{onConflict:'topic_id,article_id',ignoreDuplicates:true});check(link.error);count++;}}
 await admin.from('sources').update({status:'ok',last_fetched_at:new Date().toISOString(),error:null}).eq('id',source.id);
 }catch(e){const message=e instanceof Error?e.message:'来源读取失败';errors.push(`${source.name}: ${message}`);await admin.from('sources').update({status:'error',error:message}).eq('id',source.id);}}
 const status=errors.length?(count?'partial':'failed'):'succeeded';await admin.from('monitoring_runs').update({status,articles_count:count,error:errors.join('；')||null,finished_at:new Date().toISOString()}).eq('id',run.id);await admin.from('product_events').insert({user_id:user.id,event:status==='failed'?'feature_error':'refresh_succeeded'});return NextResponse.json({count,errors,status});}
 if(resource==='feeds'&&req.method==='GET'){
 const {data:links,error}=await db.from('topic_articles').select('article_id,topic_id');check(error);const bookmarks=await db.from('saved_articles').select('article_id');check(bookmarks.error);const ids=[...new Set([...(links?.map(l=>l.article_id)??[]),...(bookmarks.data?.map(s=>s.article_id)??[])])];if(!ids.length)return NextResponse.json({articles:[],saved:[]});
 const {data:articles,error:ae}=await db.from('articles').select('*,article_sources(source_id,sources(name))').in('id',ids).gte('published_at',cutoff).order('published_at',{ascending:false}).limit(500);check(ae);const {data:saved,error:saveError}=await db.from('saved_articles').select('article_id');check(saveError);return NextResponse.json({articles:articles?.map(a=>({...a,topic_ids:links?.filter(l=>l.article_id===a.id).map(l=>l.topic_id)})),saved:saved?.map(s=>s.article_id)});}
 if(resource==='saved'&&req.method==='POST'){const article=uuid.parse(body.article_id);const result=body.saved?await db.from('saved_articles').upsert({user_id:user.id,article_id:article}):await db.from('saved_articles').delete().eq('user_id',user.id).eq('article_id',article);check(result.error);return NextResponse.json({ok:true});}
 if(resource==='ideas'){
 if(id)uuid.parse(id);
 if(req.method==='POST'||req.method==='PATCH'){const value=z.object({title:z.string().trim().min(1).max(200),notes:z.string().max(20000)}).parse(body);const result=req.method==='POST'?await db.from('ideas').insert({...value,user_id:user.id}).select().single():await db.from('ideas').update({...value,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id).select().single();check(result.error);return NextResponse.json(result.data);}
 if(req.method==='DELETE'){const r=await db.from('ideas').delete().eq('id',id).eq('user_id',user.id);check(r.error);return NextResponse.json({ok:true});}}
 if(resource==='ai'&&req.method==='POST'){
 const value=z.object({kind:z.enum(['summary','idea']),resource_id:uuid,key:uuid}).parse(body);
 let input='';if(value.kind==='idea'){const {data,error}=await db.from('ideas').select('title,notes').eq('id',value.resource_id).eq('user_id',user.id).single();check(error);input=JSON.stringify(data)}else{const allowed=await db.from('sources').select('id').in('url',SOURCE_URLS);check(allowed.error);const {data:link,error}=await db.from('article_sources').select('article_id').eq('article_id',value.resource_id).in('source_id',(allowed.data??[]).map(s=>s.id)).limit(1);check(error);if(!link?.length)throw new Error('无权分析此文章');const {data,error:ae}=await db.from('articles').select('title,excerpt,url,published_at').eq('id',value.resource_id).gte('published_at',cutoff).single();check(ae);input=JSON.stringify(data)}
 if(!process.env.AI_API_KEY)return NextResponse.json({demo:true,message:'AI 未配置，未调用模型、未消耗额度。请先记录问题、核对来源，再制定小规模验证步骤。'});
 const {data:op,error}=await admin.rpc('reserve_ai',{p_user:user.id,p_key:value.key,p_kind:value.kind,p_resource:value.resource_id,p_model:process.env.AI_MODEL??'gpt-4o-mini'});check(error);
 if(op.status==='succeeded'){const {data,error}=await db.from('ai_analyses').select('result').eq('operation_id',op.id).single();check(error);if(!data)throw new Error('分析记录不存在');return NextResponse.json({result:data.result})}if(op.status!=='reserved')throw new Error('此请求已失败，请重新提交');
 // A separate claim prevents two retries from calling the model for one reservation.
 const {data:claimed,error:claimError}=await admin.rpc('claim_ai',{p_operation:op.id});check(claimError);if(!claimed)return NextResponse.json({error:'分析正在处理中，请稍后查看记录'},{status:409});
 try{const result=await new OpenAICompatible().analyze(value.kind,input);const settle=await admin.rpc('settle_ai',{p_operation:op.id,p_result:result.result,p_prompt:result.prompt,p_completion:result.completion,p_error:null});check(settle.error);const cost=estimateCost(result.prompt,result.completion);await admin.from('ai_operations').update({provider:process.env.AI_PROVIDER??'openai-compatible',estimated_cost_usd:cost,cost_basis:cost===null?'未配置单价或服务未返回Token':'按管理员配置的每百万Token单价估算，非账单'}).eq('id',op.id);return NextResponse.json({result:result.result})}catch(e){await admin.rpc('settle_ai',{p_operation:op.id,p_result:{},p_prompt:null,p_completion:null,p_error:e instanceof Error?e.message:'AI 失败'});throw e;}}
 if(resource==='waitlist'&&req.method==='POST'){const r=await admin.from('product_events').insert({user_id:user.id,event:'pro_waitlist'});check(r.error);return NextResponse.json({ok:true});}
 if(resource==='account'&&req.method==='DELETE'){if(body.confirm!=='DELETE')throw new Error('请确认删除');const {error}=await admin.auth.admin.deleteUser(user.id);check(error);return NextResponse.json({ok:true});}
 return NextResponse.json({error:'接口不存在'},{status:404});
 }catch(e){const message=e instanceof Error?e.message:'请求失败';return NextResponse.json({error:message},{status:/额度|上限|频率|等待一分钟|已有采集/.test(message)?429:400});}}
async function route(req:NextRequest,context:{params:Promise<{path:string[]}>}){const response=await handler(req,context);response.headers.set('Cache-Control','private, no-store');return response}
export {route as GET,route as POST,route as PATCH,route as DELETE};
