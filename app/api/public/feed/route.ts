import {NextResponse} from 'next/server';
import {publicFeed} from '@/lib/public-feed';
export const runtime='nodejs';
export async function GET(){
 try{return NextResponse.json(await publicFeed(),{headers:{'Cache-Control':'public, max-age=30, stale-while-revalidate=60'}})}
 catch{return NextResponse.json({error:'真实资讯暂时无法读取，请稍后重试。也可以先查看明确标注的 Demo。'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
