import {z} from 'zod';
export const topicSchema=z.object({name:z.string().trim().min(1).max(100),keywords:z.array(z.string().max(80)).max(20),excluded:z.array(z.string().max(80)).max(20),source_ids:z.array(z.string().uuid()).min(1).max(5),timezone:z.string().refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}},'无效时区'),start_hour:z.number().int().min(0).max(23),end_hour:z.number().int().min(0).max(24),frequency:z.enum(['daily','hourly']),brief_time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)});
export function parseInterest(input:string):{name:string;keywords:string[];excluded:string[];timezone:string;start_hour:number;end_hour:number;frequency:'daily'|'hourly';brief_time:string}{
 const hour=input.match(/(?:早上|上午|每天|每日)\s*(\d{1,2})[点:时]/)?.[1];
 const range=input.match(/(\d{1,2})[点时]?(?:到|至|[-~])\s*(\d{1,2})[点时]/);
 const keywords=input.match(/AI|人工智能|GitHub|机器人|大模型|开源|科技|设计|创业/gi)??[];
 return {name:input.slice(0,60),keywords:[...new Set(keywords)],excluded:[],timezone:'Asia/Shanghai',start_hour:range?Math.min(23,+range[1]):0,end_hour:range?Math.min(24,+range[2]):24,frequency:'daily' as const,brief_time:`${String(Math.min(23,Number(hour??9))).padStart(2,'0')}:00`};
}
export function normalizeUrl(raw:string){const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error('无效文章链接');u.hash='';for(const k of [...u.searchParams.keys()])if(k.startsWith('utm_')||['fbclid','gclid'].includes(k))u.searchParams.delete(k);u.searchParams.sort();return u.toString();}
export function validDate(raw?:string){if(!raw)return null;const n=Date.parse(raw);return Number.isFinite(n)?new Date(n).toISOString():null;}
export function inHours(iso:string|null,zone:string,start:number,end:number){if(!iso)return false;const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',hourCycle:'h23'}).format(new Date(iso)));return start===end|| (start<end?hour>=start&&hour<end:hour>=start||hour<end);}

export function safeNext(raw:string|null){if(!raw||!raw.startsWith('/')||raw.startsWith('//')||raw.includes('\\'))return '/';try{const u=new URL(raw,'https://internal.invalid');return u.origin==='https://internal.invalid'&&['/','/space','/dashboard','/topics','/feeds','/ideas','/auth/reset'].includes(u.pathname)?u.pathname+u.search:'/'}catch{return '/'}}
