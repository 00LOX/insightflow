# 开源复用与许可证核查

以下架构选型记录来自 2026-11-10；当前锁文件的许可证复核见 [V0.1 审计](LICENSE-AUDIT.md)，不要把旧项目元数据当成实时状态。

核查日期：2026-11-10。仓库信息来自 GitHub 元数据和 Starter 的 package.json/README；维护活跃不代表没有漏洞，也未声称已审计完整仓库。

| 项目 | 许可证 / 最近推送 | 适配、运营成本与决策 |
|---|---|---|
| [nextjs/saas-starter](https://github.com/nextjs/saas-starter) | MIT；2025-12-11；未归档 | 含自建 JWT 账号、Drizzle、Stripe，且固定 Canary Next。只参考架构，不整体复制，避免重复认证和不必要支付依赖。 |
| [supabase/supabase](https://github.com/supabase/supabase) | 仓库 Apache-2.0；2026-11-10 | 使用官方 SDK、Auth 和 PostgREST，轻量 PostgreSQL 本地组合；不克隆巨型仓库。各组件许可证分别保留，不将整个产品简单归为单一许可证。 |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | 当前仓库 AGPL-3.0；2026-11-10 | 商业使用不等于免除网络服务和源代码义务；路由和依赖维护量大。首版不安装、不复制其代码。 |
| [dgtlmoon/changedetection.io](https://github.com/dgtlmoon/changedetection.io) | Apache-2.0；2026-11-10 | Python、浏览器抓取与变更监测增加运营和安全成本，延后。 |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | MIT；2026-11-10 | 多阶段 Agent 对当前单次分析流程收益不足；不引入 Python 或额外 Agent 服务。 |

没有采用已归档的 vercel/nextjs-subscription-payments。

## 实际依赖

精确版本见 package.json 和 pnpm-lock.yaml，完整 npm 依赖许可证清单见 [licenses.json](licenses.json)。Next.js、React、Supabase JS/SSR、Tailwind、Zod、Radix、CVA、Vitest 和 Playwright 等按照各自许可证使用。RSS parser 为 MIT；Lucide 按其包声明保留许可。shadcn/ui Button 模式依据 MIT 许可适配（Copyright shadcn），没有复制品牌界面或资产。

本地镜像包括 PostgreSQL（PostgreSQL License）、Supabase Auth（MIT）、PostgREST（MIT）、Mailpit（MIT）和 Kong Gateway OSS（Apache-2.0）。Docker 镜像还包含各基础系统组件，不能将这份组件清单视为完整镜像 SBOM。PostgreSQL 已固定实际拉取并验证的 digest；其他组件固定版本标签，首次部署应核对镜像来源及目标平台。

许可为 MIT、BSD、ISC、Apache 等的组件通常可用于商业产品，但仍须保留声明并履行各许可证义务。自动生成的清单来自包声明，不能替代文件级法律审查。新闻内容版权不因 RSS 或软件许可证而转移。

## 兼容性与安全修复

固定 TypeScript 5.9.3 与 ESLint 9.39.1，以匹配 Next.js ESLint 插件支持范围；最新 TypeScript 7 与解析器不兼容，ESLint 10 存在插件 peer 冲突。ESLint 9 有上游弃用提示，作为开发工具暂时固定，审计未发现漏洞；后续需与框架插件一起升级。

通过 pnpm-workspace.yaml 将 minimatch 固定到已修补的 11.0.1，并重跑 Lint、构建和测试。最终 pnpm audit 的实际结果见测试报告；没有安装付费工具或购买服务。
