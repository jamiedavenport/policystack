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

- `apps/www` - A stub where the old OpenPolicy site was hosted. Now just redirects to the new site.
- `packages/cli` - A CLI tool for installing and configuring PolicyStack.
- `packages/core` - The core compilation engine for PolicyStack.
- `packages/sdk` - The public API for defining privacy policies with PolicyStack.
- `packages/vite` - A Vite plugin for integrating PolicyStack into your project.
- `packages/react` - React components and hooks for PolicyStack.
- `packages/svelte` - Svelte components and hooks for PolicyStack.
- `packages/vue` - Vue components and hooks for PolicyStack.
- `packages/astro` - Astro components and hooks for PolicyStack.

### Other Directories

There are a few other directories that might be useful to know about when working on the project:

- `opencookies` - The seperate project for consent management. As part of the 1.0.0 release, this will be merged into the main project.
- `policystack` - The seperate project for the privacy policy website. As part of the 1.0.0 release, this will be merged into the main project.

## Important Notes

### `v1.0.0`

We're actively working on the 1.0.0 release.

- The primary branch for this is `v1`.
- **All PRs for 1.0 / PolicyStack work (any `PS-*` ticket) MUST target the `v1` branch, not `main`.** `v1` is well ahead of `main`; opening against `main` produces a wrong, bloated diff. Cut feature branches from `v1` and set the PR base to `v1` explicitly (the harness default of `main` is incorrect for this work).
- **Name the feature branch with the Linear-provided branch name when one exists** — use the issue's `gitBranchName` (e.g. `ps-20`), available from the Linear MCP `get_issue`/`list_issues` `gitBranchName` field or "Copy git branch name" in Linear. Linear auto-links any PR whose head branch matches, so the ticket tracks the PR and its status with no manual linking. Still cut it from `v1` and target `v1`.
- Breaking changes are allowed on the `v1` branch.
- Failing tests are acceptable on the `v1` branch.
- **Do not add changesets for 1.0 / PolicyStack work (any `PS-*` ticket).** The 1.0 release is versioned as a single event; per-feature changesets going into `v1` are noise. Do not create `.changeset/*.md` files for this work.
- Projects and tickets are in the `PolicyStack 1.0` team in Linear.
