import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'InsightFlow — 把关注，变成洞察',description:'从可信来源获取资讯，用 AI 理解变化，让灵感成为行动。'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:`try{document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/>{children}</body></html>}
