---
"@openpolicy/sdk": patch
---

Fix published packages shipping `"@openpolicy/core": "workspace:*"` (and other `workspace:` references) verbatim, which broke installs for pnpm consumers with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`. Migrated the repo's package manager from Bun to pnpm@10 so `changeset publish` now routes through `pnpm publish`, which rewrites the `workspace:` protocol to the resolved version on the way to npm.
