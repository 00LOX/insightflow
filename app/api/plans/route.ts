import {NextResponse} from 'next/server';
import {adminDb} from '@/lib/supabase';
export async function GET(){try{const {data,error}=await adminDb().from('plan_limits').select('*').order('topics');if(error)throw error;return NextResponse.json(data)}catch{return NextResponse.json({error:'套餐配置读取失败'},{status:503})}}
