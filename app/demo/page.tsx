import Link from 'next/link';
import {Logo} from '@/components/logo';
import {Theme} from '@/components/theme';
import {PublicPreview} from '@/components/public-preview';

export default function Demo(){return <><header className="public-header"><Link href="/"><Logo/></Link><nav><Theme/><Link className="button button-light" href="/login">开始使用</Link></nav></header><main className="demo-page"><h1>先看一条中文解读</h1><p>不用注册，试试中英文对照和收藏。</p><PublicPreview/><p className="demo-note">这是固定内容的交互示例，不是实时资讯，也不会调用模型。</p><div className="demo-next"><Link className="button" href="/login">进入我的阅读空间</Link><a className="text-link" href="https://github.com/00LOX" target="_blank" rel="noopener noreferrer">关注项目进展</a></div></main></>}
