# OpenPolicy

## Toolchain — Vite+ (`vp`)

This project uses [Vite+](https://viteplus.dev), a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. Vite+ wraps dev-server, build, test, lint, format, type-check, and package-manager operations behind a single global CLI called `vp`.

The package manager is pnpm (managed via Corepack); `vp` detects it via `packageManager` in `package.json` and delegates accordingly. Do not invoke `pnpm`/`npm`/`yarn` directly when a `vp` equivalent exists.

### Common commands

- `vp install` (`vp i`) — install dependencies
- `vp dev` — run the dev server
- `vp build` — production build
- `vp pack` — build libraries (wraps tsdown)
- `vp test` — run tests (Vitest-backed)
- `vp check` — run format, lint, and type-checks in one pass
- `vp fmt` / `vp lint` — format or lint individually
- `vp run <script>` — execute a `package.json` script
- `vp run -r <script>` — run a script across all workspaces in dep order
- `vp add` / `vp remove` / `vp update` — dependency management
- `vp dlx <pkg>` — one-shot binary execution (replacement for `npx`)
- `vp exec <bin>` — run a binary from local `node_modules/.bin`

Run `vp help` for the full list and `vp <command> --help` for specifics.

### Pitfalls

- Don't install `vitest`, `oxlint`, `oxfmt`, or `tsdown` directly — Vite+ ships them. You cannot upgrade them independently; run `vp upgrade` to bump `vp`.
- `vp dev` / `vp test` / `vp build` invoke the built-in tools, **not** any `package.json` script of the same name. Run custom scripts with `vp run <name>`.
- Import test utilities from `vite-plus/test`, not `vitest`:

  ```ts
  import { expect, test } from "vite-plus/test";
  ```

- `vp check` requires at least one of `fmt` or `lint` enabled in the root `vite.config.ts`.

## Project Structure

This is a pnpm monorepo with `apps/*`, `packages/*`, `tooling/*`, and `examples/*` workspaces (declared in `pnpm-workspace.yaml`). `shamefully-hoist=true` is set in `.npmrc` so example apps can resolve transitive deps the way they did under Bun's flat `node_modules`.

- `packages/sdk` — `@openpolicy/sdk`: public API — `defineConfig()` and related types
- `packages/core` — `@openpolicy/core`: compilation engine; published to npm as a dependency of sdk and vite
- `packages/vite` — `@openpolicy/vite`: Vite plugin (`openPolicy()`) that compiles policies at build time
- `packages/cli` — `@openpolicy/cli`: CLI tool that installs OpenPolicy into a project and prints a setup prompt for coding agents
- `packages/react`, `packages/vue` — framework integrations
- `packages/renderers` — `@openpolicy/renderers`: Markdown / HTML / PDF renderers; published to npm
- `tooling/tsconfig` — `@openpolicy/tooling`: shared `tsconfig` base

## Domain Concepts

- **Policy types**: `"privacy"` (PrivacyPolicyConfig) and `"cookie"` (CookiePolicyConfig) — `PolicyInput` is a discriminated union
- **Policy definition**: TypeScript object passed to `defineConfig()` describing the policy content
- **Compilation**: Policy definitions compile to HTML, Markdown, or PDF via `@openpolicy/core` + `@openpolicy/renderers` (e.g. from React/Vue components at runtime, or inline in Astro frontmatter). The Vite plugin scans source at build time to auto-populate `dataCollected` / `thirdParties`. The CLI (`@openpolicy/cli`) handles first-run setup — it installs packages and prints a setup prompt for coding agents; it no longer generates policy files.
- **Section builders**: Each section is `(config) => PolicySection | null`; `null` omits the section
- **Output filenames**: `privacy-policy.{ext}` for privacy, `cookie-policy.{ext}` for cookie
- **Formats**: `markdown` | `html` | `pdf` (implemented); `jsx` throws "not yet implemented"
- **Compliance targets**: GDPR, CCPA, and multi-jurisdiction templates
- **`llms.txt`**: AI-readable reference for auto-generating policy configs from existing codebases

## Config shape must stay compatible with the Vite plugin

Any change to `OpenPolicyConfig` (`packages/core/src/types.ts`) or `defineConfig` (`packages/sdk/src/index.ts`) MUST keep the `@openpolicy/vite` auto-collect pipeline working. The plugin populates user configs at build time via spread sentinels — those spreads have to land in the right place after any reshape.

The plugin emits three sentinels into a virtual module that users spread into their config:

- `...dataCollected` → spread into `data.collected` (`Record<string, string[]>`)
- `...thirdParties` → spread into top-level `thirdParties` (`ThirdPartyEntry[]`)
- `...cookies` → spread into `cookies.used` (`{ essential: true; [k]: boolean }`)

It also writes `openpolicy.gen.ts` augmenting two interfaces in `@openpolicy/sdk` so `defineConfig`'s generic forces every scanned key to appear in the sibling sub-maps:

- `ScannedCollectionKeys` — every scanned data category must appear in `data.context` (with `purpose`, `lawfulBasis`, `retention`, and `provision`)
- `ScannedCookieKeys` — every scanned cookie category must appear in `cookies.context`

When changing the config shape:

- The three spread targets above must remain assignable from the plugin's emitted shapes — don't move `data.collected`, `thirdParties`, or `cookies.used` without also updating `writeAutoCollectedDts` and the virtual module body in `packages/vite/src/index.ts`.
- Any new sub-map keyed off `data.collected` (or `cookies.used`) must thread through `defineConfig`'s `Collected`/`CookieUsed` generics so `ScannedCollectionKeys`/`ScannedCookieKeys` continue to enforce exhaustiveness.
- `collecting()`, `thirdParty()`, and `defineCookie()` are the source-level call shapes the scanner recognises (`packages/vite/src/scan.ts`). Their argument shapes are part of the public contract — changing them is a breaking change to the plugin too.
- After any config reshape, run the `examples/vue` (or any example with `openPolicy()` wired up) build and confirm `openpolicy.gen.ts` regenerates with both interface augmentations and that the resulting policy compiles without validator errors.

## Git Hooks

Git hooks are managed by Vite+ (`vp config`) with scripts in `.vite-hooks/`. After cloning, run:

```sh
vp config
```

Two hooks are active:

- **pre-commit** — `vp staged`: runs Oxfmt + Oxlint on staged files via the `staged` config in `vite.config.ts`
- **pre-push** — `vp run -r check-types`: runs `tsc --noEmit` across all packages

## Versioning & Release

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing. Publishable packages are `@openpolicy/sdk`, `@openpolicy/cli`, `@openpolicy/vite`, `@openpolicy/core`, `@openpolicy/renderers`, `@openpolicy/react`, and `@openpolicy/vue`.

### Pre-1.0 bump policy

While we are at `0.0.x`, **use `patch` in changesets for every change — including breaking ones**. We explicitly accept breaking changes during this phase and don't differentiate them with `minor`/`major` bumps yet. Describe the breaking nature in the changeset body so consumers can see it in the CHANGELOG; only switch to semver-correct `major`/`minor` bumps after the first `1.0.0` release.

### Automated release flow

Releases are fully automated via `.github/workflows/release.yml` using `changesets/action`:

1. **Add a changeset** as part of your feature/fix PR:

   ```sh
   pnpm changeset
   ```

   Commit the generated `.changeset/*.md` file alongside your changes.

2. **Merge to `main`** → CI runs and opens (or updates) a **"Version Packages" PR** that bumps `package.json` versions and updates `CHANGELOG.md` files.

3. **Merge the "Version Packages" PR** → CI publishes all changed packages to NPM and creates GitHub releases.

### Required secret

`NPM_TOKEN` (an npm Automation token) must be set in **GitHub repo → Settings → Secrets and variables → Actions**. `GITHUB_TOKEN` is provided automatically by GitHub Actions.

### Manual commands (local use only)

```sh
# Bump versions and generate CHANGELOGs
pnpm run version-packages

# Build all packages and publish to NPM (pnpm publish rewrites workspace:* → real versions)
pnpm run publish-packages
```

### Build output

`vp pack` (per-package) produces `dist/*.js` + `dist/*.d.ts` via tsdown. `@openpolicy/core` is a regular `dependency` of `sdk` and `vite` — it is published to npm and installed alongside them. `cli` no longer depends on `core` or `renderers` — it only shells out to the user's package manager and prints a prompt.

## CI Integration

GitHub Actions uses [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to install `vp` and the package manager in one step:

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Testing

Use `vp test` to run tests. Tests run on Vitest under the hood (bundled by Vite+).

```ts
import { expect, test } from "vite-plus/test";

test("policy compiles to markdown", () => {
	// ...
});
```

## TypeScript

- Strict mode is enabled (`tsconfig.json`)
- `moduleResolution: "bundler"` — use Vite-style imports
- JSX is configured as `react-jsx`
- `verbatimModuleSyntax` is on — use `import type` for type-only imports
- Prefer `type` over `interface` for all type declarations

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes before starting work.
- [ ] Run `vp check` and `vp test` to validate changes before committing.
- [ ] Add a changeset with `pnpm changeset` for any user-facing change to a published package.
