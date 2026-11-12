'use client';
import {useState} from 'react';
import {Bookmark,ArrowUpRight,Sparkles} from 'lucide-react';

export function PublicPreview(){
 const [saved,setSaved]=useState(false),[original,setOriginal]=useState(false);
 return <section className="preview-reader" aria-label="资讯阅读预览">
  <div className="preview-bar"><span>阅读预览</span><span>示例内容 · 不调用 AI</span></div>
  <article>
   <div className="article-meta"><span>GitHub 官方博客</span><button className="icon-button" aria-label={saved?'取消预览收藏':'收藏预览资讯'} aria-pressed={saved} onClick={()=>setSaved(!saved)}><Bookmark size={19} fill={saved?'currentColor':'none'}/></button></div>
   <h2>{original?'Git security vulnerabilities announced':'Git 发布安全更新，修复六个漏洞'}</h2>
   {original?<p>Git is releasing updates addressing six security vulnerabilities affecting recursive clones, reference handling, merges, binary patches, and imports.</p>:<><p>Git 正在发布安全更新，修复涉及克隆、合并、补丁等操作的六个漏洞。对开发者来说，值得先核对自己使用的 Git 版本，再查看官方公告。</p><div className="preview-insight"><Sparkles size={16}/><div><strong>为什么值得关注</strong><p>代码工具也需要安全更新。来源摘要未列出受影响版本和漏洞编号，升级前应核对原文，避免把推测当成事实。</p></div></div></>}
   <div className="preview-actions"><button className="text-link" onClick={()=>setOriginal(!original)}>{original?'返回中文解读':'对照英文摘要'}</button><a className="text-link" href="https://github.blog/open-source/git/git-security-vulnerabilities-announced-7/" target="_blank" rel="noopener noreferrer">查看来源 <ArrowUpRight size={14}/></a></div>
   {saved&&<p className="preview-saved" role="status">已收藏到本次预览。完整应用会保存到你的账户。</p>}
  </article>
 </section>
}
