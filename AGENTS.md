<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## InsightFlow 后续各轮规则（用户原文）

【规则】先原样写入仓库根目录 AGENTS.md（已有则合并；工具读 CLAUDE.md 则按其约定），以后各轮直接引用。
- 禁止：密钥/密码入代码或提交（含 git 历史）；破坏性数据库迁移；删除有价值功能（不要的入口只隐藏）。
- 先问我：公开仓库、付费或买域名、正式上线、发布 Release、引入许可证不明的依赖。
- 必须：AI Key 与额度只在服务端；无 Key 时界面标明"AI 未配置"，不伪造结果；预置示例内容须标注"示例"；游客调用 AI 有服务端限流（成本高则改为 AI 需登录），超额引导登录；RSS 只展示标题/摘要/来源链接，不转载全文；服务端抓取防 SSRF（仅 http/https，拦截内网和本机地址，限超时与大小）。
