# Contributing to PolicyStack

## Setup

```bash
git clone https://github.com/jamiedavenport/policystack
cd openpolicy
corepack enable      # picks up the pnpm version pinned in package.json
pnpm install
vp config
```

`vp config` installs git hooks into `.vite-hooks/` and points `core.hooksPath` at them:

- **pre-commit** — `vp staged`: runs Oxfmt + Oxlint on staged files (auto-fixes in place)
- **pre-push** — `vp run -r check-types`: runs `tsc --noEmit` across all packages

## Project Structure

This is a pnpm monorepo (workspaces declared in `pnpm-workspace.yaml`):

| Package            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `packages/sdk`     | `@policystack/sdk` — public API (`defineConfig`) |
| `packages/core`    | `@policystack/core` — compilation engine         |
| `packages/vite`    | `@policystack/vite` — Vite plugin                |
| `packages/cli`     | `@policystack/cli` — CLI tool                    |
| `apps/docs`        | Documentation site (Next.js + Fumadocs)          |
| `tooling/tsconfig` | Shared TypeScript base config                    |

## Development Workflow

```bash
# Run all tests
vp test

# Type-check all packages
vp run -r check-types

# Build all packages (produces dist/*.js + dist/*.d.ts)
vp run -r build
```

### Working on `@policystack/core`

`core`'s `package.json` exports point to `./dist/` (not `./src/`). After changing source files in `packages/core`, rebuild it before other packages will pick up the changes:

```bash
pnpm --filter @policystack/core run build
```

### Running the CLI locally

```bash
pnpm --filter @policystack/cli exec tsx src/cli.ts --help
```

## Architecture

### Core compilation pipeline

```
PolicyStackConfig → compilePrivacyPolicy()/compileCookiePolicy() → section builders → DocumentSection[] → renderer → string
```

- **`PolicyStackConfig`** is the single, flat public config. There is no intermediate per-document projection — the section builders read it directly and derive values (`userRights`, `consentMechanism`, the per-document `version`) at their point of use.
- **Section builders** are functions `(config: PolicyStackConfig, t) => DocumentSection | null`. Returning `null` omits the section.
- **`compilePrivacyPolicy` / `compileCookiePolicy`** gate emission via `shouldEmit()` and return `Document | null`.
- **Renderers** (`@policystack/renderers`) turn the `Document` tree into Markdown, HTML, or PDF.

### Adding a new section

1. Add a builder function in `packages/core/src/documents/privacy.ts` or `documents/cookie.ts`.
2. Register it in the relevant `compile*Document()` `SECTION_BUILDERS` array.
3. Add any new fields to `PolicyStackConfig` in `types.ts`.
4. Write tests in `packages/core/src/*.test.ts`.

## Testing

```bash
# All packages
vp test

# Single package
pnpm --filter @policystack/core run test
```

Tests use Vitest via Vite+. Import test utilities from `vite-plus/test` (not `vitest`):

```ts
import { expect, test } from "vite-plus/test";
```

Keep tests co-located or in the same package as the code they cover.

## Code Style

Oxfmt handles formatting and Oxlint handles linting, both via Vite+. The pre-commit hook auto-fixes staged files — you generally don't need to run it manually. To check manually:

```bash
vp check --fix
```

TypeScript strict mode is on (`verbatimModuleSyntax`, `moduleResolution: bundler`). Use `import type` for type-only imports.

## Releases

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning.

1. After making your changes, run:

   ```bash
   pnpm changeset
   ```

   Follow the prompts to describe what changed and which packages are affected.

2. Commit the generated `.changeset/*.md` file alongside your code changes.

3. Open a pull request against `main`. CI will validate your changes.

4. Once merged, the GitHub Actions workflow automatically opens a "Version Packages" PR. Merging that PR publishes the updated packages to NPM. `pnpm publish` rewrites `workspace:*` references to the real published version on the way out.

Publishable packages: `@policystack/sdk`, `@policystack/core`, `@policystack/vite`, `@policystack/cli`, `@policystack/react`, `@policystack/vue`, `@policystack/svelte`.

## Pull Requests

- Keep changes focused — one concern per PR.
- Include a changeset for any user-facing change to a published package.
- Ensure `vp test` and `vp run -r check-types` pass before opening a PR.
- For significant changes to the compilation pipeline or public API, open an issue first to discuss the approach.
