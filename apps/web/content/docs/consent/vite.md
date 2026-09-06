---
title: Detect ungated analytics with the Vite plugin
description: "Vite plugin — surfaces ungated cookie and vendor calls in dev and CI"
sidebar:
  label: Vite plugin
---

> **PolicyStack V1** — current documentation. [Supported capabilities and limitations](/docs/reference/support).

Vite plugin for Consent. Runs `@policystack/vite` against your source on dev start and on every HMR update, and surfaces ungated cookie writes / vendor calls as Vite warnings — or build failures.

## Install

```sh
bun add -D @policystack/vite
```

## Usage

`@policystack/vite` exports a single `policyStack()` plugin that serves both products. The cookie scanner is opt-in via the `consent` option — pass it and the plugin scans your source for ungated cookie writes and vendor scripts in addition to its policy duties:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { policyStack } from "@policystack/vite";

export default defineConfig({
	plugins: [
		policyStack({
			consent: { mode: "warn" },
		}),
	],
});
```

The categories the scanner checks against are derived from the `cookies` block of your `policystack.ts` — there is no separate categories array to maintain here.

## Options

These are the keys of the plugin's `consent` option:

| Option    | Type                         | Default                             | Description                                                                                                                 |
| --------- | ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `mode`    | `"warn" \| "error" \| "off"` | `"warn"` in dev, `"error"` in build | Controls how findings are reported. `error` causes `vite build` to fail when ungated findings remain. `off` skips scanning. |
| `include` | `string[]`                   | scanner default                     | Glob(s) of files to scan.                                                                                                   |
| `exclude` | `string[]`                   | scanner default                     | Glob(s) to exclude from the scan.                                                                                           |

For custom rules or a custom vendor registry, call the scanner library directly — see [`@policystack/vite/consent`](/docs/consent/scanner).

## Modes

- **`warn`** (dev default): prints findings via Vite's logger. Does not fail the dev server.
- **`error`** (build default): same console output, plus throws at `buildEnd` if any ungated findings remain — so CI fails.
- **`off`**: scanner does not run.

## Output

Each ungated finding is printed as:

```
[policystack] ungated google-analytics (analytics) call via global at src/app.tsx:12:3
  Rule: vendor-imports
  Fix: wrap call sites in <ConsentGate requires="…"> or guard with store.has("category")
  Suppress: // consent-ignore-next-line
```

A summary line follows: `[policystack] N cookies, M vendors, K ungated`.

## HMR

On every save, the plugin re-runs the scanner against the changed file only (no full project re-scan). Findings added or cleared by the edit are logged inline. The incremental path stays under 50 ms on typical files.

## Suppression

Inherits the scanner's comment syntax:

```ts
// consent-ignore-next-line
gtag("event", "ad_view");
```

Or per-file (must appear in the first 10 lines):

```ts
// consent-ignore-file
```

## Compatibility

Compatible with Vite 5 and 6. Framework-agnostic — works with React, Vue, Svelte, SolidStart, SvelteKit, Astro, Nuxt 3, and Remix because the plugin only consumes file paths and source text.

## See also

- [`@policystack/vite/consent`](/docs/consent/scanner) — underlying detection engine, suppression syntax, custom rules
- [`@policystack/core/consent`](/docs/consent/core) — runtime store and `<ConsentGate>` / `has()` shapes the scanner looks for
- [Framework adapters](/docs/reference/support#which-frameworks-does-policystack-support) — React, Vue, Solid, Svelte

## License

Apache-2.0
