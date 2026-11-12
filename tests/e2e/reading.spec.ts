import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const account=JSON.parse(fs.readFileSync('tests/.accounts.json','utf8'))[0];
test('首页阅读、搜索、收藏进入我的空间、采集记录保留',async({page})=>{
 await page.goto('/login');await page.getByLabel('邮箱',{exact:true}).fill(account.email);await page.getByLabel('密码',{exact:true}).fill(account.password);await page.getByRole('button',{name:'登录工作空间'}).click();await expect(page).toHaveURL('http://localhost:3000/');
 const first=page.locator('.reader-article').first();await expect(first).toBeVisible();const title=await first.locator('.article-title').innerText();const bookmark=first.getByRole('button',{name:/收藏文章|取消收藏/});if(await bookmark.getAttribute('aria-label')==='取消收藏')await bookmark.click();await first.getByRole('button',{name:'收藏文章'}).click();await expect(first.getByRole('button',{name:'取消收藏'})).toBeVisible();
 await page.getByRole('link',{name:'我的空间',exact:true}).click();await expect(page.locator('[aria-label="我的收藏"]')).toContainText(title);
 await page.getByRole('link',{name:'首页',exact:true}).click();await page.getByRole('textbox',{name:'描述关注主题'}).fill('no-matching-text-987654');await page.getByRole('button',{name:'搜索资讯',exact:true}).click();await expect(page.locator('.reader-results')).toContainText('没有符合条件的资讯');
 await page.goto('/space?section=topics');await page.getByText('最近采集记录',{exact:true}).click();await expect(page.locator('.run-log')).toContainText('完成');
});
