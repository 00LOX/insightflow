# V0.1 release draft — not published

Read official RSS, understand it in Chinese, and keep your own ideas. The interface has two main workspaces: Home and My Space.

## Included

- Guest RSS browsing, natural-language filters, editable rules and source links.
- Account-isolated bookmarks, topics, preferences, ideas and history.
- Server-side AI keys and quotas; login required for real AI, explicit “AI 未配置” fallback.
- Responsive desktop/mobile layouts and dark mode. `/demo` contains labeled fixed examples.
- Existing six database migrations preserved. No destructive migration.

## Limits

Only the GitHub official blog is currently collected. AI works from RSS titles/excerpts, not full articles. No payments, scheduled delivery or complex agents. Public deployment and actual iOS Safari testing are pending. The current milestone is not yet publicly released.

## Maintainer publication steps — require owner confirmation

1. Review [license recommendation](LICENSE-AUDIT.md), source screenshots and [deployment plan](DEPLOYMENT.md).
2. Confirm the destination GitHub repository and visibility. Do not change an existing private repository to public implicitly. Prefer a reviewed source snapshot if retaining private development history is unnecessary.
3. Scan the complete intended Git history and build again; enable GitHub secret scanning where available. The inherited inactive development-password placeholder is discussed in the audit.
4. Push the approved source, run GitHub Actions and verify the public deployment flow before claiming it works online.
5. After separate Release approval, create tag `v0.1.0` at the verified commit and draft the first GitHub Release using this text. Attach the reviewed public source ZIP and its SHA-256 file if desired. Do not attach database dumps, environment files, logs or test account credentials.
6. Replace deployment placeholders with a verified public URL, and publish only after the owner approves. No tag or Release has been created by these instructions.

Suggested description: **A minimal RSS reader with Chinese AI explanations, private bookmarks and an idea workspace.**

Suggested topics: `rss`, `rss-reader`, `nextjs`, `supabase`, `deepseek`, `self-hosted`, `open-source`, `ai`, `chinese`.

Social preview: [social-preview.png](social-preview.png), 1200×630; editable source: [social-preview.svg](social-preview.svg). Use the PNG in GitHub's social preview setting. Never use an account screenshot containing personal data.
