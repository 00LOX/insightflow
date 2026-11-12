# 开发与运行

要求 Node.js 24.5+、pnpm 11.25.0。完整应用需要 Docker Desktop（Linux containers）或 Docker Engine + Compose v2。

```bash
pnpm install --frozen-lockfile
pnpm db:start
pnpm db:migrate
pnpm dev
```

网页：`http://localhost:3000`。本地确认邮件：`http://localhost:54324`。预览页面 `/demo` 不需要数据库或注册。Windows 后续可双击 `Start-InsightFlow.cmd` 启动生产构建。

`db:start` 自动生成被 Git 忽略的 `.env.local` 与 `local/runtime.env`。请保留已有非空密钥；Git 不同步私人数据库或配置。不要执行 `docker compose down -v`，它会删除本机数据卷。停止服务可用 `docker compose stop`。

## 模型配置

在 `.env.local` 中设置 `AI_BASE_URL`、`AI_MODEL`、`AI_API_KEY`，保存并重启网页。支持 OpenAI 兼容的 Chat Completions 与 JSON 输出，DeepSeek 已通过受控真实调用验证。不要给服务端密钥添加 `NEXT_PUBLIC_` 前缀。

未配置 Key 时不调用模型、不扣应用 AI 额度；页面明确标注“AI 未配置”。真实 AI 仅登录后使用，匿名请求由服务端拒绝；不把固定示例伪装成分析。输入仅包含文章标题和 RSS 摘要或用户填写的想法，不抓取链接全文。Token 单价未设置时费用估算为未知，不是零费用。应用额度与服务商计费分开。

## 验证

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

完整本机验证需先启动数据库、迁移和网页，再执行：

```bash
pnpm db:test
pnpm test:reading
pnpm test:rls
pnpm test:security
pnpm db:verify
pnpm exec playwright install chromium
pnpm test:e2e
python scripts/check-source-secrets.py --history --build
```

`db:test` 会生成被忽略的 `tests/.accounts.json`。`test:reading` 需要已有真实采集文章。阶段 D 并发与恢复检查需要设置 `TEST_PHASE=D` 后运行 `db:test`，PowerShell 使用 `$env:TEST_PHASE='D'`。

浏览器 AI 交互测试使用明确模拟夹具，不发付费模型请求。真实服务验证单独进行，并记录成功、失败和 Token。测试不得对当前用户自动发起批量付费分析。

## 项目结构

- `app/`：公开预览、认证、阅读工作区和 API。
- `components/`：页面交互与公共预览。
- `lib/`：规则、来源和 AI Provider。
- `supabase/migrations/`：业务结构、数据隔离和额度事务。
- `local/`、`compose.yaml`：本地数据库、认证、邮件和网关。
- `scripts/`：初始化、迁移、备份及打包。
- `tests/`：单元、数据库与浏览器检查。

更多背景见 [架构说明](ARCHITECTURE.md)、[部署边界](DEPLOYMENT.md) 和 [已知限制](KNOWN-ISSUES.md)。本地 Compose 仅供本机开发，不能直接暴露到公网。

## V0.1 页面与交付

主工作区只有 `/`（公开资讯）与 `/space`（私人内容）。旧 dashboard/feeds/topics/ideas 地址重定向到对应工作区，能力继续保留。新增公开接口 `/api/public/feed` 只返回白名单来源的公开字段。

开源发布使用 `python scripts/package-public.py` 的显式文件白名单；不会上传。ZIP、校验值与当前 Git 工作树对应，不含 Git 历史和私人运行数据。完整私有交接脚本 `scripts/package.py` 不作为公开发布材料。

安全脚本扫描源码、可达 Git blobs 和构建中的已知秘密及常见令牌格式，不是未知秘密检测保证。完整本轮结果见 [TEST-V0.1.md](TEST-V0.1.md)。
