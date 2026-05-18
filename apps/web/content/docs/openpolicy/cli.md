---
title: CLI
description: Install OpenPolicy and generate an agent prompt in one command
product: openpolicy
---

`@policystack/cli` sets up OpenPolicy in your project. Run it once — it installs the right packages for your stack, scaffolds a starter `policystack.ts`, and prints a prompt you can paste into a coding agent (Claude Code, Cursor, etc.) to finish filling in your config from your codebase.

## Run it

From the root of your project:

```sh
bunx @policystack/cli init
# or: npx @policystack/cli init
# or: pnpm dlx @policystack/cli init
```

That's the whole flow. The CLI is meant for one-time setup — once it's done, uninstall or ignore it.

## What it does

1. **Detects your package manager** from lockfiles (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`) or the `packageManager` field in `package.json`. Falls back to `npm`.
2. **Detects frameworks** by reading your `package.json` dependencies and installs the matching OpenPolicy integration:
   - `vite` → `@policystack/vite` (devDependency)
   - `react` → `@policystack/react`
   - `vue` → `@policystack/vue`
   - `svelte` → `@policystack/svelte`
   - `@policystack/sdk` is always installed.
3. **Writes a starter `policystack.ts`** to `src/policystack.ts` if a `src/` directory exists, otherwise to the project root.
4. **Prints an agent prompt** between delimiters so you can copy it into a coding agent and have the rest of your config filled in automatically from your codebase.

## Flags

| Flag                          | Default       | Description                                  |
| ----------------------------- | ------------- | -------------------------------------------- |
| `--cwd <path>`                | `.`           | Working directory                            |
| `--pm <bun\|pnpm\|yarn\|npm>` | auto-detected | Override package-manager detection           |
| `--skip-install`              | `false`       | Skip installation; only print the prompt     |
| `--dry-run`                   | `false`       | Show planned actions without executing       |
| `--yes`, `-y`                 | `false`       | Skip the confirmation prompt                 |
| `--out <path>`                | auto-detected | Output path for the starter `policystack.ts` |
| `--force`                     | `false`       | Overwrite an existing `policystack.ts`       |

## Why a prompt instead of a wizard?

A coding agent reading your actual codebase can fill in `data.collected`, `data.context`, `thirdParties`, `jurisdictions`, and cookie usage more accurately than a series of prompts ever could — it infers from your ORM schemas, imports, environment variables, and existing legal copy. The CLI gives you the scaffolding, the agent supplies the content.

See [Configuration](/docs/openpolicy/configuration) for the shape of `policystack.ts` and [Auto-collect](/docs/openpolicy/policies/auto-collect) for declaring data collection inline in your source.
