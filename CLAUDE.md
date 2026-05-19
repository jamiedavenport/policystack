# PolicyStack

Open-source primitives for building privacy-first applications. A pnpm-workspace monorepo using the Vite+ (`vp`) toolchain.

## Code Style

- TypeScript strict mode; avoid `any` and `unknown`.
- Use `type` over `interface`.
- Prefer named exports over default exports.

## Commands

Use `vp` ([Vite+](https://viteplus.dev)) for everything — it wraps dev/build/test/lint/format/type-check and delegates to pnpm. Don't call `pnpm`/`npm`/`yarn`/`npx` directly when a `vp` equivalent exists.

- `vp install`, `vp dev`, `vp build`, `vp pack` (build libraries)
- `vp test`, `vp check` (format + lint + type-check in one pass)
- `vp run <script>`, `vp run -r <script>` (all workspaces, dep order)
- `vp add`/`remove`/`update` (deps), `vp dlx <pkg>` (≈ npx), `vp exec <bin>`

`vp help` / `vp <command> --help` for the rest.

## Project Structure

All packages are `@policystack/*`; nothing is published to npm yet (first publish is the 1.0.0 cut). Per-framework packages split `./policy` and `./consent` subpath exports.

- `core` — compilation engine + consent runtime (`./consent` subpath)
- `sdk` — public API: `defineConfig()`, `renderLlmsTxt()`
- `cli` — install/configure CLI
- `vite` — `policyStack()` plugin + opt-in consent scanner
- `react`/`vue`/`svelte`/`angular`/`solid` — framework components & hooks (React also has `./provider`; `solid`/`renderers` export from `./src`)
- `scripts` — consent-gated third-party script loaders
- `renderers` — shared policy render layer
- `tooling/tsconfig` — shared TS base config (`./base`)
- `apps/web` — the policystack.dev site (dogfoods `react`/`sdk`); `apps/www` — redirect stub
- `examples/tanstack` — the sole SDK example
