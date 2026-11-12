import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const account=JSON.parse(fs.readFileSync('tests/.accounts.json','utf8'))[0];
test('中文卡片、站内阅读、结果复看和中文搜索',async({page})=>{
 await page.goto('/login');await page.getByLabel('邮箱',{exact:true}).fill(account.email);await page.getByLabel('密码',{exact:true}).fill(account.password);await page.getByRole('button',{name:'登录工作空间'}).click();await expect(page).toHaveURL('http://localhost:3000/');
 const boot=await (await page.request.get('/api/bootstrap')).json();const feed=await (await page.request.get('/api/public/feed')).json();const article=feed.articles[0];expect(article).toBeTruthy();
 const result={title:'Git 安全更新：修复多项漏洞',summary:'明确测试夹具：Git 发布安全更新。',importance:'帮助判断更新需要',actions:['核对来源'],suggested_topics:[]};
 await page.route('**/api/bootstrap',route=>route.fulfill({json:{...boot,analyses:[{resource_id:article.id,result},...boot.analyses]}}));
 let calls=0;await page.route('**/api/ai',route=>{calls++;return route.abort()});await page.reload();const card=page.locator('.reader-article').first();await expect(card.locator('.article-title')).toContainText(result.title);await expect(card).toContainText(result.summary);
 await card.locator('.article-title').click();await expect(page.getByRole('dialog',{name:'资讯阅读'})).toContainText(result.summary);await page.getByRole('button',{name:'关闭',exact:true}).click();await card.getByRole('button',{name:'查看中文解读'}).click();await expect(page.getByRole('dialog',{name:'AI 分析'})).toContainText(result.summary);expect(calls).toBe(0);await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('textbox',{name:'描述关注主题'}).fill('修复多项漏洞');await page.getByRole('button',{name:'搜索资讯',exact:true}).click();await expect(page.locator('.reader-article')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
