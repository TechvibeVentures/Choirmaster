# Deployment (Preview via Vercel)

This project uses **Vercel** for Preview deployments.

## Standard Preview Flow (Always)
1. Commit changes on a `codex/` branch.
2. Push the branch to GitHub.
3. Deploy Preview with the Vercel CLI:

```bash
npx vercel --confirm --scope team_xbDMnG89fPDdCWEE0V1sY4jQ
```

## Notes
- The Vercel project is `choirmaster` under the `techvibe` team.
- The CLI returns both an **Inspect** URL and a **Preview** URL.
- If `--confirm` is deprecated, the CLI may suggest `--yes`. Use `--confirm` unless the team standard changes.

