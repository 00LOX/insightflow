import {test,expect} from '@playwright/test';

test('游客首页真实 RSS、来源、可编辑搜索、AI 登录保护',async({page})=>{
 let modelCalls=0;await page.route('**/api/ai',route=>{modelCalls++;return route.abort()});
 await page.goto('/');await expect(page.getByRole('heading',{name:'今天，想了解什么？'})).toBeVisible();const article=page.locator('.reader-article').first();await expect(article).toBeVisible();await expect(article.getByRole('link',{name:'来源原文'})).toHaveAttribute('href',/^https:\/\//);
 await page.getByRole('textbox',{name:'描述关注主题'}).fill('最近一周 GitHub 和 AI');await page.getByRole('button',{name:'搜索资讯',exact:true}).click();await expect(page.getByRole('region',{name:'搜索配置'})).toBeVisible();await expect(page.getByLabel('关键词（逗号分隔，匹配任意一个）')).toHaveValue('GitHub,AI');
 await article.getByRole('button',{name:'生成中文解读'}).click();await expect(page.getByRole('status')).toContainText('请先登录');expect(modelCalls).toBe(0);
 await page.getByRole('button',{name:'查看示例'}).click();await expect(page.getByRole('heading',{name:'示例：中文解读与收藏'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('AI 未配置明确显示，示例不混入实时结果',async({page})=>{
 // UI-only no-key fixture; an isolated real server is checked in security-v01.mjs.
 await page.route('**/api/public/feed',async route=>{const r=await route.fetch();const feed=await r.json();await route.fulfill({json:{...feed,aiEnabled:false}})});
 await page.goto('/');await expect(page.getByRole('status')).toContainText('AI 未配置');await expect(page.locator('.inline-demo')).toHaveCount(0);await expect(page.locator('.reader-article').first()).toBeVisible();
});

test('来源状态请求失败时，不伪称知道 AI 配置',async({page})=>{await page.route('**/api/public/feed',route=>route.fulfill({status:503,json:{error:'真实资讯暂时无法读取'}}));await page.goto('/');await expect(page.getByRole('alert').filter({hasText:'真实资讯暂时无法读取'})).toBeVisible();await expect(page.getByText('AI 未配置。真实 RSS 仍可浏览，示例不代表实时分析。',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:'查看示例',exact:true}).click();await expect(page.getByRole('heading',{name:'示例：中文解读与收藏'})).toBeVisible()});
