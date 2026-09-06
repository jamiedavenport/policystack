---
title: PolicyStack CLI — init, validate, and MCP
description: Set up PolicyStack V1, validate TypeScript configurations as JSON, and connect coding agents through the stdio MCP server.
sidebar:
  label: CLI and MCP
---

> **PolicyStack V1** — current documentation. [Supported capabilities and limitations](/docs/reference/support).

`@policystack/cli` sets up Policy in your project. Run it once — it installs the right packages for your stack, scaffolds a starter `policystack.ts`, and prints a prompt you can paste into a coding agent (Claude Code, Cursor, etc.) to finish filling in your config from your codebase.

## Run it

From the root of your project:

```sh
bunx @policystack/cli init
```

The CLI also supports validation and an MCP server; keep it installed when you use those development workflows.

## What it does

1. **Detects your package manager** from lockfiles (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`) or the `packageManager` field in `package.json`. Falls back to `npm`.
2. **Detects frameworks** by reading your `package.json` dependencies and installs the matching Policy integration:
   - `vite` → `@policystack/vite` (devDependency)
   - `react` → `@policystack/react`
   - `vue` → `@policystack/vue`
   - `svelte` → `@policystack/svelte`
   - `@policystack/sdk` is always installed.
3. **Writes a starter `policystack.ts`** to `src/policystack.ts` if a `src/` directory exists, otherwise to the project root.
4. **Prints an agent prompt** between delimiters so you can copy it into a coding agent and have the rest of your config filled in automatically from your codebase.

## Flags

| Flag                          | Default       | Description                                     |
| ----------------------------- | ------------- | ----------------------------------------------- |
| `--cwd <path>`                | `.`           | Working directory                               |
| `--pm <bun\|pnpm\|yarn\|npm>` | auto-detected | Override package-manager detection              |
| `--skip-install`              | `false`       | Skip installation; still write config/reference |
| `--dry-run`                   | `false`       | Show planned actions without executing          |
| `--yes`, `-y`                 | `false`       | Skip the confirmation prompt                    |
| `--out <path>`                | auto-detected | Output path for the starter `policystack.ts`    |
| `--force`                     | `false`       | Overwrite an existing `policystack.ts`          |

## Why a prompt instead of a wizard?

A coding agent reading your codebase can help draft `data.collected`, `data.context`, `thirdParties`, `jurisdictions`, and cookie usage more accurately than a series of prompts ever could — it infers from your ORM schemas, imports, environment variables, and existing legal copy. The CLI gives you the scaffolding, the agent supplies the content.

See [Configuration](/docs/policy/configuration) for the shape of `policystack.ts` and [Auto-collect](/docs/policy/policies/auto-collect) for declaring data collection inline in your source.

## Validate a config

```sh
pnpm add -D @policystack/cli@1
pnpm exec policystack validate --json
```

Review the structured diagnostics and fix the indicated declarations. Type checking and validation do not determine whether your disclosures are legally adequate.

## Connect MCP tools

```sh
pnpm exec policystack mcp
```

Configure your coding agent to launch that command as a stdio MCP server from the application directory. It exposes `validate_config`, `scaffold_config`, `explain_jurisdiction`, `list_data_categories`, `explain_issue`, and `scan_ungated`. See the [generated SDK reference](/sdk.txt) and [agent workflows](/docs/policy/agent-skills).

Implementation: [CLI commands](https://github.com/jamiedavenport/policystack/blob/main/packages/cli/src/index.ts), [MCP tool registry](https://github.com/jamiedavenport/policystack/blob/main/packages/cli/src/mcp/tools.ts).
