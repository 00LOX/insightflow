import 'server-only';
import {adminDb} from './supabase';
import {readFeed,SOURCE_URLS} from './rss';

let refresh:Promise<void>|undefined;
let lastAttempt=0;
// Only fixed official sources are collected; visitors cannot supply fetch URLs.
export async function publicFeed(){
 const db=adminDb();
 const {data:sources,error:sourceError}=await db.from('sources').select('id,name,url,last_fetched_at').in('url',SOURCE_URLS);
 if(sourceError||!sources?.length)throw new Error('公开来源尚未就绪');
 if(Date.now()-lastAttempt>60000&&!refresh){
  lastAttempt=Date.now();
  refresh=(async()=>{
   for(const source of sources){
    if(source.last_fetched_at&&Date.now()-Date.parse(source.last_fetched_at)<300000)continue;
    const claimed=await db.rpc('claim_source',{p_source:source.id});
    if(claimed.error||!claimed.data)continue;
    try{
     for(const article of await readFeed(source.url)){
      const saved=await db.from('articles').upsert(article,{onConflict:'url'}).select('id').single();
      if(saved.error||!saved.data)throw new Error('采集存储失败');
      const linked=await db.from('article_sources').upsert({article_id:saved.data.id,source_id:source.id});
      if(linked.error)throw new Error('来源关联失败');
     }
     await db.from('sources').update({status:'ok',error:null,last_fetched_at:new Date().toISOString()}).eq('id',source.id);
    }catch{await db.from('sources').update({status:'error',error:'公开来源暂时无法更新'}).eq('id',source.id)}
   }
  })().finally(()=>{refresh=undefined});
 }
 if(refresh)await refresh;
 const links=await db.from('article_sources').select('article_id,source_id').in('source_id',sources.map(s=>s.id));
 if(links.error)throw new Error('公开来源读取失败');
 const ids=[...new Set((links.data??[]).map(x=>x.article_id))];
 if(!ids.length)return {articles:[],sources:sources.map(({id,name})=>({id,name})),aiEnabled:!!process.env.AI_API_KEY};
 // Explicit projection: never include private analyses, user IDs, keys or source errors.
 const result=await db.from('articles').select('id,title,excerpt,url,published_at,updated_at,fetched_at').in('id',ids).gte('published_at',new Date(Date.now()-7*86400000).toISOString()).lte('published_at',new Date().toISOString()).order('published_at',{ascending:false}).limit(100);
 if(result.error)throw new Error('公开资讯读取失败');
 return {articles:(result.data??[]).map(a=>({...a,source_names:sources.filter(s=>links.data?.some(l=>l.article_id===a.id&&l.source_id===s.id)).map(s=>s.name)})),sources:sources.map(({id,name})=>({id,name})),aiEnabled:!!process.env.AI_API_KEY};
}
