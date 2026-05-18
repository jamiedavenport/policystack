# policystack.dev

Marketing and documentation site for **PolicyStack** — modern privacy and consent primitives for developers and AI.

## What PolicyStack is

PolicyStack ships small, composable building blocks that let teams handle privacy/consent the same way they handle auth, payments, or feature flags: as code, in their stack, version-controlled, testable. The thesis is that the current consent + policy ecosystem is dominated by heavy SaaS banners and hand-written legal pages that don't compose with modern app architectures (and don't speak to AI agents at all).

The project is split across several open-source repos. This repo is just the website.

## Sibling repos

### [policystack](https://github.com/jamiedavenport/policystack) — `policystack.dev`

Define a privacy/cookie policy once as a TypeScript config, render it as React components. Ships a shadcn-style consent banner. Disclaimer: it generates documents, it doesn't give legal advice. Mostly TypeScript with Astro docs and a Svelte adapter. Active — currently around `@policystack/react@0.0.30`.

### [policystack](https://github.com/jamiedavenport/policystack)

Headless consent state machine + framework hooks. UI is whatever you build around it. Sub-4kb core, adapters for React / Vue / Solid / Svelte / Angular. Includes a Vite plugin that flags ungated cookie usage at dev time, a static scanner, pre-built script integrations (GA, Meta Pixel, …), and a planned CLI. Apache-2.0, pre-1.0.

Both repos use changesets, pnpm workspaces, and a `packages/*` layout.

## This repo

TanStack Start (Vite + Nitro + React 19 + Tailwind v4), file-based routing, TypeScript. Currently a clean shell — the v1 Astro version is in git history.

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
pnpm preview
```
