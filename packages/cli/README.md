# `@policystack/cli`

> Install [PolicyStack](https://policystack.dev) into your project and print a setup prompt for your coding agent.

One command installs `@policystack/sdk` plus the right framework integration for your stack (Vite / React / Vue), writes an `policystack.ts` stub, and prints a prompt you can paste into Claude Code, Cursor, or any other coding agent to finish setup by reading your codebase.

## Usage

From the root of your project:

```sh
bunx @policystack/cli init
# or: npx @policystack/cli init
# or: pnpm dlx @policystack/cli init
```

That's it — the CLI detects your package manager from lockfiles, installs the right packages, scaffolds `src/policystack.ts` (or `policystack.ts` if you don't have a `src/` directory), and prints the agent prompt.

### Flags

| Flag                          | Default                                  | Description                                   |
| ----------------------------- | ---------------------------------------- | --------------------------------------------- |
| `--cwd <path>`                | `.`                                      | Working directory                             |
| `--pm <bun\|pnpm\|yarn\|npm>` | auto-detected                            | Override package-manager detection            |
| `--skip-install`              | `false`                                  | Print the prompt only; don't install packages |
| `--dry-run`                   | `false`                                  | Show planned actions without executing        |
| `--yes`, `-y`                 | `false`                                  | Skip the confirmation prompt                  |
| `--out <path>`                | `src/policystack.ts` or `policystack.ts` | Output path for the stub                      |
| `--force`                     | `false`                                  | Overwrite an existing stub                    |

## What gets installed

- `@policystack/sdk` — always
- `@policystack/vite` (dev) — if `vite` is in your `package.json`
- `@policystack/react` — if `react` is in your `package.json`
- `@policystack/vue` — if `vue` is in your `package.json`

## Documentation

[policystack.dev/docs](https://policystack.dev/docs)

## Links

- [GitHub](https://github.com/jamiedavenport/policystack)
- [policystack.dev](https://policystack.dev)
- [npm](https://www.npmjs.com/package/@policystack/cli)
