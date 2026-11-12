import {z} from 'zod';
import {inHours,parseInterest} from './rules';

export const readerFilterSchema=z.object({
 keywords:z.array(z.string().trim().max(80)).max(20),
 excluded:z.array(z.string().trim().max(80)).max(20),
 days:z.enum(['1','7']),
 start_hour:z.number().int().min(0).max(23),
 end_hour:z.number().int().min(0).max(24),
 timezone:z.string().refine(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true}catch{return false}})
});
export type ReaderFilter=z.infer<typeof readerFilterSchema>;
export function parseReaderSearch(text:string):ReaderFilter{
 const draft=parseInterest(text);
 return {keywords:draft.keywords.length?draft.keywords:text.trim()?[text.trim().slice(0,80)]:[],excluded:draft.excluded,days:/今天|24小时|一天/.test(text)?'1':'7',start_hour:draft.start_hour,end_hour:draft.end_hour,timezone:draft.timezone};
}
export function matchesReaderFilter(article:{title:string;excerpt:string;published_at:string|null},filter:ReaderFilter,now=Date.now()){
 if(!article.published_at)return false;
 const published=Date.parse(article.published_at);
 if(!Number.isFinite(published)||published>now||published<now-Number(filter.days)*86400000)return false;
 const text=(article.title+' '+article.excerpt).toLowerCase();
 return (!filter.keywords.length||filter.keywords.some(k=>text.includes(k.toLowerCase())))&&!filter.excluded.some(k=>text.includes(k.toLowerCase()))&&inHours(article.published_at,filter.timezone,filter.start_hour,filter.end_hour);
}
