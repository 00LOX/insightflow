'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Logo} from './logo';
import {Theme} from './theme';
export function AppNav(){const path=usePathname();return <header className="reader-nav"><Link href="/" aria-label="InsightFlow 首页"><Logo/></Link><nav aria-label="主要工作区"><Link href="/" aria-current={path==='/'?'page':undefined}>首页</Link><Link href="/space" aria-current={path==='/space'?'page':undefined}>我的空间</Link></nav><Theme/></header>}
