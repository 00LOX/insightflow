# V0.1 免费公开部署方案（尚未执行）

核查日期：2026-11-13。以下是准备方案，尚未创建站点或发布 Release；GitHub 源码公开与网站上线是独立步骤。用户规则要求先确认托管方案与正式上线。

## 免费方案对比

| 方案 | 免费额度与商用 | 闲置与超额 | 中国大陆访问 |
|---|---|---|---|
| **推荐：Netlify Free + Supabase Free** | Netlify 300 credits/月，允许商业项目；部署、流量和计算共享 credits。Supabase 500 MB 数据库、5 GB egress、50,000 MAU、最多 2 个活跃项目 | Netlify 不靠闲置休眠，免费额度耗尽会暂停项目；Supabase 闲置一周可暂停 | 境外 CDN 与数据库，未测真实大陆线路，无法承诺稳定或低延迟 |
| Vercel Hobby + Supabase Free | Hobby 当前仅限个人非商业用途，不能作为后续免费商用承诺；每月含 100 GB Fast Data Transfer、100 万次函数调用、4 CPU 小时；具体执行限制见实时控制台。Supabase 同上 | Hobby 超额有资源限制；数据库同样可能闲置暂停 | 同属境外链路，未做大陆实测；框架适配方便不代表大陆连接保证 |

Netlify 的月额度依据[当前计费文档](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)，商用范围见[官方 Free 说明](https://www.netlify.com/blog/introducing-netlify-free-plan/)（旧文额度不适用）。Vercel 限制见 [Hobby](https://vercel.com/docs/plans/hobby)；数据库见 [Supabase Pricing](https://supabase.com/pricing)。免费政策可能变化，创建前再核对，不启用自动付费升级。

**建议先 Netlify 默认免费子域名 + Supabase Free，无 AI Key 上线验收，再受控开启 AI。** 当前来源少，先验证是否有人持续阅读；不购买域名，不把任何人的本机数据库直接暴露到公网。

## 需要所有者登录/授权的清单

1. 确认“采用 Netlify Free + Supabase Free 部署公开演示”；这不等于同意公开现有私有仓库或发布 Release。
2. 登录 Supabase，选择组织、新建空项目和合适地区，保留强数据库密码；不在聊天中提供密码或服务端密钥。
3. 登录 Netlify，授权需要的部署入口。如果要关联 GitHub，先另行确认仓库名称、可见性和允许上传的源码范围。
4. 在 Supabase 与托管平台的私密设置中填 Key。AI 可先留空。若要让任意用户按当前邮箱流程注册，需配置正式 SMTP；OAuth 入口尚未实现，如选择此方案须另行开发与验收，不能只填服务商配置就宣称可用。Supabase 默认测试 SMTP 不能视为公开可用邮件服务，见[官方限制](https://supabase.com/docs/guides/auth/auth-smtp)。任何需付费/购买域名的选项另行询问。
5. 站点 URL 生成后，在 Supabase Auth 填准确的 Site URL 和 Redirect URLs，再完成线上双账号验收。

## 确认后才执行的配置

- Node 24、pnpm 11.25.0；安装 `pnpm install --frozen-lockfile`，构建 `pnpm build`，由 Netlify 的 Next.js 集成处理 Route Handlers/SSR，不能只上传静态 out 目录。[官方适配说明](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- 只向空的目标 Supabase 项目审阅并依次应用现有六个 `supabase/migrations`；不运行 `local/init.sql`，不覆盖托管 Auth Schema，不把本机测试账户或邮箱导入公开服务。
- 环境变量：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 为浏览器公开配置；`SUPABASE_SERVICE_ROLE_KEY` 为服务端秘密；`NEXT_PUBLIC_APP_URL` 为实际 HTTPS origin。AI 的 `AI_BASE_URL`、`AI_MODEL`、`AI_API_KEY` 仅服务端。更改 NEXT_PUBLIC 变量后重新构建。
- Auth Site URL：`https://<实际站点>.netlify.app`；允许 `https://<实际站点>.netlify.app/auth/callback` 及 `/auth/reset`。仅按需要保留本地开发回调，不使用宽泛生产通配符。占位符不能直接粘贴上线。
- 平台日志不打印请求凭据，按需设置平台流量防护。真实 AI 必须登录，并继续使用数据库事务配额。匿名 AI 返回 401，不向模型发送请求。公开 RSS 仅固定来源，缓存与来源锁减少请求；大规模负载尚未验证。
- 跨境速度至少用中国大陆实际网络和另一条网络测首页、RSS、Auth。记录冷启动、失败率与延迟；没有测量前不宣传“国内秒开”。

## 上线后必须实测

无痕游客打开首页 → 搜索到真实 RSS → 来源链接可打开 → 无 Key 明确提示 → 注册/确认或 OAuth 登录 → 账号 A 收藏 → 账号 B 看不到 A 收藏/想法/偏好。再测匿名 AI、超额、跨站写入和无 Key 不扣额度；线上截图不得含邮箱/Key。没有真实部署 URL 前，不把本地通过写成线上验收通过。

## 本机数据和备份

`local/runtime.env`、`.env.local`、`tests/.accounts.json`、Docker 数据卷、Mailpit 邮件和 `backups/` 全部属于私有运行数据，不进入公开源码。`pnpm db:backup` 导出包含认证与用户记录的私密备份，另行加密保存。`pnpm db:verify` 只在独立临时数据库验证 Schema，不改工作数据库。

本地 Compose 的密码现在随机生成并同步，仍然只是开发用网关、测试邮件与回环端口，不能直接作为公网部署方案。停止可用 `docker compose stop`；不要通过 `down -v` 删除现有成果。
