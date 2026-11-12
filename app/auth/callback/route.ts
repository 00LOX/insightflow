import {NextRequest,NextResponse} from 'next/server';
import {safeNext} from '@/lib/rules';
import {sessionDb} from '@/lib/supabase';
export async function GET(req:NextRequest){const code=req.nextUrl.searchParams.get('code');if(code){const db=await sessionDb();const {error}=await db.auth.exchangeCodeForSession(code);if(!error){const next=req.nextUrl.searchParams.get('next');return NextResponse.redirect(new URL(safeNext(next),process.env.NEXT_PUBLIC_APP_URL??req.url))}}return NextResponse.redirect(new URL('/login',process.env.NEXT_PUBLIC_APP_URL??req.url));}
