'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,Radio,Newspaper,Lightbulb,LogOut,Plus} from 'lucide-react';
import {Logo} from './logo';
import {Theme} from './theme';
import {browserDb} from '@/lib/browser-db';
const links=[['/dashboard','今日概览',LayoutDashboard],['/topics','我的关注',Radio],['/feeds','资讯阅读',Newspaper],['/ideas','我的想法',Lightbulb]] as const;
export function Shell({children,email}:{children:React.ReactNode,email:string}){const path=usePathname(),router=useRouter();return <div className="app-shell"><aside className="sidebar"><Link href="/"><Logo/></Link><div className="workspace-label">个人工作空间</div><nav>{links.map(([href,label,Icon])=><Link key={href} href={href} className={path===href?'nav-link active':'nav-link'}><Icon size={19}/>{label}{href==='/topics'&&<Plus size={14} className="nav-plus"/>}</Link>)}</nav><div className="sidebar-bottom"><div className="account"><span className="avatar">{email[0]?.toUpperCase()}</span><div><strong>我的工作空间</strong><small>{email}</small></div><button className="icon-button" aria-label="退出登录" onClick={async()=>{await browserDb().auth.signOut();router.push('/login');router.refresh()}}><LogOut size={17}/></button></div></div></aside><div className="app-body"><header className="workspace-header"><span>工作空间 <span className="muted">/ {links.find(x=>x[0]===path)?.[1]??'概览'}</span></span><div><Theme/><button className="icon-button mobile-logout" aria-label="退出登录" onClick={async()=>{await browserDb().auth.signOut();router.push('/login');router.refresh()}}><LogOut size={16}/></button></div></header><main className="workspace-main">{children}</main><div className="workspace-footer">为你的好奇心而构建 <span>InsightFlow · V1.1</span></div></div></div>}
