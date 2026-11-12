# 依赖许可证与项目协议建议

核查日期：2026-11-13。未新增业务依赖。现有根目录 LICENSE 是继承的 MIT，本轮未创建、替换或改写它；是否沿用由所有者在公开前确认。package.json 的 MIT 声明也沿用原仓库。

## 实际覆盖

- 当前锁文件：571 个唯一包版本（包括其他操作系统的可选二进制包），0 个缺失许可证声明。详见 [licenses-lock.json](licenses-lock.json)，包含锁文件 SHA-256、版本、许可证与声明来源。
- Windows 已安装树：464 个包版本，见 [licenses.json](licenses.json)。已去掉本机绝对路径。
- 使用安装包声明与 npm registry 对应精确版本元数据；这是依赖声明清点，不是对所有源文件、二进制或容器基础层的法律审计，不证明无安全漏洞。
- 重新核查：`pnpm audit:licenses`。安装树变化后先用 `pnpm licenses list --json` 更新原始元数据，再去掉机器路径并重新核对。锁文件变更须重新生成报告。

| SPDX 声明 | 锁文件包版本数 |
|---|---:|
| MIT | 473 |
| Apache-2.0 | 38 |
| LGPL-3.0-or-later | 10 |
| Apache-2.0 AND LGPL-3.0-or-later AND MIT | 1 |
| Apache-2.0 AND LGPL-3.0-or-later | 3 |
| BlueOak-1.0.0 | 3 |
| Python-2.0 | 1 |
| MPL-2.0 | 13 |
| CC-BY-4.0 | 1 |
| BSD-2-Clause | 8 |
| ISC | 15 |
| BSD-3-Clause | 2 |
| CC0-1.0 | 1 |
| 0BSD | 2 |

## 需要保留的义务

主要直接依赖 Next.js、React、Supabase JS/SSR、Tailwind、Radix、Zod、RSS Parser、Lucide，以及测试工具的许可证声明均已识别。MIT / BSD / ISC / Apache 允许商业使用仍需按原文保留许可、版权及适用 NOTICE。

- **Sharp 平台包及 libvips**：锁文件包含 LGPL-3.0-or-later 及组合许可证。Windows 的 `@img/sharp-win32-x64@0.35.5` 声明 `Apache-2.0 AND LGPL-3.0-or-later`。Linux 平台的 Sharp/libvips 也必须核对，不能因为 Windows 安装树没出现而遗漏。若分发二进制/镜像，保留其声明并提供适用的库源代码与重新链接/替换条件；并非把整个项目自动改成 LGPL。见 [LGPL 原文](https://www.gnu.org/licenses/lgpl-3.0.en.html) 和 [Sharp licensing](https://sharp.pixelplumbing.com/install/#licensing)。
- **MPL-2.0**：包括 Lightning CSS 平台包及开发检查工具 axe-core。分发其代码或修改文件时保留 MPL 声明并满足相应源码提供义务。单纯在服务端运行与向浏览器分发代码是不同范围，见 [Mozilla FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)。
- **caniuse-lite**：CC-BY-4.0 数据，保留作者、许可与改动说明要求，不能当作全树 MIT。
- **shadcn/ui Button 模式**：保留来源及 MIT 版权许可，见根目录 THIRD_PARTY_NOTICES.md。未复制品牌资产。
- 本地 PostgreSQL、Supabase Auth、PostgREST、Mailpit、Kong 镜像有独立软件及基础层许可；本报告不是容器 SBOM。
- RSS 标题/摘要/链接的内容权利不随应用源码开放而转移，公开运营前复核来源使用条款。仓库不打包文章数据库与原文全文。

## MIT / Apache-2.0 / AGPL-3.0 取舍

| 协议 | 商用与闭源衍生 | 主要影响 | 对本项目建议 |
|---|---|---|---|
| MIT | 允许商用及闭源分发，保留版权与许可 | 简短，复用门槛低；没有 Apache 那样明示的专利条款 | **建议沿用**，贴合降低门槛和积累用户；仍需确认权属与继承声明 |
| Apache-2.0 | 允许商用及闭源衍生 | 明示专利授权/终止、声明修改并保留适用 NOTICE；不授予商标 | 如重视企业贡献和专利条款，可在有权授权部分另行评估；不能抹掉第三方原许可 |
| AGPL-3.0 | 允许商用和收费，但受强 copyleft 约束 | 修改后通过网络提供服务时须向交互用户提供对应源码，分发也有义务 | 不作为本轮默认选择；会增加闭源托管衍生与商业合作门槛，不能靠它保证 Stars 或收入 |

依据：[MIT 原文](https://opensource.org/license/mit)、[Apache-2.0 原文](https://www.apache.org/licenses/LICENSE-2.0)、[AGPL-3.0 原文（特别是第 13 节）](https://www.gnu.org/licenses/agpl-3.0.en.html)。这是项目选择建议，不替代具体分发场景和权属审查。

## 公开前历史与材料风险

当前源码、可达 Git blobs 与构建产物已针对本机已知真实凭据及常见私钥/令牌格式扫描。自动扫描有检测范围，不能保证识别任意未知秘密。`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 是设计上公开的配置；service-role、AI Key、数据库密码和测试账号均不进入公开文件。

继承历史中有一个旧的固定本地开发密码占位值。本轮已替换为随机私密凭据并轮换本机角色，旧值失效；未重写历史，也不能宣称它从历史消失。推荐公开经过审查的源码快照，保留本地完整开发历史。如果要公开完整历史或重写历史，先由所有者明确确认后处理，绝不直接把现有私有仓库改公开。

依赖清单、页面截图及公开 ZIP 不包含用户邮箱、个人笔记、数据库或真实确认链接。发布前仍须人工复核仓库目标、许可证、来源条款和平台权限。
