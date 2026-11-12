# 参与贡献

最有帮助的反馈是具体的使用问题：哪个页面、做了什么、希望发生什么、实际发生了什么。

新增来源时请提供官方 RSS 地址和使用条款。界面改动优先减少步骤，保留来源、错误反馈和键盘可操作性。

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

完整浏览器测试还需要本地数据库与测试账户，见 [开发说明](docs/DEVELOPMENT.md)。AI 交互回归应使用明确的模拟响应，避免消耗贡献者的真实 API 额度。

PR 请说明解决的问题、主要改动及实际验证。截图不要包含私人邮箱、笔记、密钥或本机邮件确认链接。

请勿提交环境文件、数据库备份、测试账号、日志或模型密钥。安全问题不要附在公开 Issue 的日志或截图中。

界面保持首页与我的空间两个主工作区。新增模型功能必须明确无 Key 行为；匿名 AI 当前由服务端要求登录。新增来源必须通过 SSRF、超时、大小及内容条款检查，不能接受任意用户 URL。不要增加破坏性迁移或未经核准的许可证不明依赖。

本地完整检查另含 `pnpm test:security`、`pnpm test:rls`、`pnpm test:reading`；构建后执行 `python scripts/check-source-secrets.py --history --build`。GitHub CI 不使用私人数据库凭据，不能代替双账号/线上验收。
