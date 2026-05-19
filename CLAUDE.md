# PolicyStack

Open-source primitives for building privacy-first applications.

## Code Style

- Typescript strict mode. Avoid `any` and `unknown`.
- Use `type` over `interface` for type definitions.
- Prefer named exports over default exports.

## Commands

This project uses [Vite+](https://viteplus.dev), a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. Vite+ wraps dev-server, build, test, lint, format, type-check, and package-manager operations behind a single global CLI called `vp`.

The package manager is pnpm (managed via Corepack); `vp` detects it via `packageManager` in `package.json` and delegates accordingly. Do not invoke `pnpm`/`npm`/`yarn` directly when a `vp` equivalent exists.

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

## Project Structure

All packages are named `@policystack/*` in-repo (the OpenPolicy/OpenCookies →
PolicyStack rename is complete). Nothing has been published to npm under that
scope yet — the first publish happens as part of the 1.0.0 cut (PS-38). Old
`@openpolicy/*` / `@opencookies/*` deprecation shims were dropped, not shipped.
The only remaining old-scope references in code are the intentional dual-scope
SDK-specifier seams in `packages/vite` (`sdk-specifier.ts` / `sdk-resolver.ts`),
removed at freeze.

- `packages/core` — `@policystack/core`: compilation engine **and** the consent
  runtime (exposed via the `./consent` subpath; PolicyStack Consent was folded in here).
- `packages/sdk` — `@policystack/sdk`: public API (`defineConfig()`), incl. the
  `renderLlmsTxt()` generator.
- `packages/cli` — `@policystack/cli`: install/configure CLI.
- `packages/vite` — `@policystack/vite`: Vite plugin (`policyStack()`); also hosts
  the opt-in consent scanner.
- `packages/react` / `vue` / `svelte` / `angular` / `solid` — per-framework
  components & hooks; each splits `./policy` and `./consent` subpath exports
  (React also has `./provider`). `solid` and `renderers` export from `./src`.
- `packages/scripts` — `@policystack/scripts`: consent-gated third-party script
  loaders.
- `packages/renderers` — `@policystack/renderers`: shared policy render layer.
- `tooling/tsconfig` — `@policystack/tooling`: shared TS base config (`./base`).
- `apps/web` — the PolicyStack site (policystack.dev); dogfoods `@policystack/{react,sdk}`.
- `apps/www` — stub redirecting the old PolicyStack site.
- `examples/tanstack` — example app (the sole SDK example).

PolicyStack Consent (consent) and the policystack site were separate projects; both are
now merged in-repo (consent → `@policystack/core/consent`, site → `apps/web`).

## Important Notes

### `v1.0.0`

We're actively working on the 1.0.0 release.

- The primary branch for this is `v1`.
- **All PRs for 1.0 / PolicyStack work (any `PS-*` ticket) MUST target the `v1` branch, not `main`.** `v1` is well ahead of `main`; opening against `main` produces a wrong, bloated diff. Cut feature branches from `v1` and set the PR base to `v1` explicitly (the harness default of `main` is incorrect for this work).
- **Name the feature branch with the Linear-provided branch name when one exists** — use the issue's `gitBranchName` (e.g. `ps-20`), available from the Linear MCP `get_issue`/`list_issues` `gitBranchName` field or "Copy git branch name" in Linear. Linear auto-links any PR whose head branch matches, so the ticket tracks the PR and its status with no manual linking. Still cut it from `v1` and target `v1`.
- Breaking changes are allowed on the `v1` branch.
- **`v1` must stay green.** CI now runs on every push to `v1` (not just PRs), and
  the pipeline is `vp run -r build` → `vp check` → `vp run -r check-types` →
  `vp run -r test` (knip runs non-blocking). Do not merge red. Run tests
  per-package via `vp run -r test` — the root aggregate `vp test` drops
  per-package Vite plugins. (This supersedes the former "failing tests are
  acceptable on v1" stance.)
- **Do not add changesets for 1.0 / PolicyStack work (any `PS-*` ticket).** The 1.0 release is versioned as a single event; per-feature changesets going into `v1` are noise. Do not create `.changeset/*.md` files for this work.
- Projects and tickets are in the `PolicyStack 1.0` team in Linear.
