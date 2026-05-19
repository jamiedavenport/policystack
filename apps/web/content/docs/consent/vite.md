---
title: "@policystack/vite"
description: "Vite plugin — surfaces ungated cookie and vendor calls in dev and CI"
product: consent
---

Vite plugin for Consent. Runs `@policystack/vite` against your source on dev start and on every HMR update, and surfaces ungated cookie writes / vendor calls as Vite warnings — or build failures.

## Install

```sh
bun add -D @policystack/vite @policystack/vite @policystack/core/consent
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { openCookies } from "@policystack/vite";

export default defineConfig({
	plugins: [
		openCookies({
			config: {
				categories: [
					{ key: "necessary", label: "Necessary", locked: true },
					{ key: "analytics", label: "Analytics" },
					{ key: "marketing", label: "Marketing" },
				],
			},
		}),
	],
});
```

## Options

| Option     | Type                         | Default                             | Description                                                                                                                                     |
| ---------- | ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`   | `PolicyStackConsentConfig`   | required                            | The runtime consent config used at runtime. The plugin uses `categories[].key` to know which categories are covered when `autoSync` is enabled. |
| `mode`     | `"warn" \| "error" \| "off"` | `"warn"` in dev, `"error"` in build | Controls how findings are reported. `error` causes `vite build` to fail when ungated findings remain. `off` skips scanning entirely.            |
| `include`  | `string[]`                   | scanner default                     | Forwarded to the scanner.                                                                                                                       |
| `exclude`  | `string[]`                   | scanner default                     | Forwarded to the scanner.                                                                                                                       |
| `rules`    | `Rule[]`                     | `defaultRules`                      | Override the rule set.                                                                                                                          |
| `vendors`  | `VendorRegistry`             | `defaultVendors`                    | Override the vendor registry.                                                                                                                   |
| `autoSync` | `boolean`                    | `false`                             | When true, prints a copy-pasteable list of vendor categories that are missing from your `config.categories`.                                    |

## Modes

- **`warn`** (dev default): prints findings via Vite's logger. Does not fail the dev server.
- **`error`** (build default): same console output, plus throws at `buildEnd` if any ungated findings remain — so CI fails.
- **`off`**: scanner does not run.

## Output

Each ungated finding is printed as:

```
[policystack] ungated google-analytics (analytics) call via global at src/app.tsx:12:3
  Rule: vendor-imports
  Fix: wrap call sites in <ConsentGate category="…"> or guard with store.has("category")
  Suppress: // consent-ignore-next-line
```

A summary line follows: `[policystack] N cookies, M vendors, K ungated`.

## HMR

On every save, the plugin re-runs the scanner against the changed file only (no full project re-scan). Findings added or cleared by the edit are logged inline. The incremental path stays under 50 ms on typical files.

## autoSync

`autoSync: true` flags vendor categories your scan detected that are not yet declared in `config.categories`. The plugin prints a suggested snippet — it does not write to disk. Persisted sync (writing to your config file) is handled by `@policystack/cli`.

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

- [`@policystack/vite`](/docs/consent/scanner) — underlying detection engine, suppression syntax, custom rules
- [`@policystack/core/consent`](/docs/consent/core) — runtime store and `<ConsentGate>` / `has()` shapes the scanner looks for
- [Framework adapters](../../#packages) — React, Vue, Solid, Svelte

## License

Apache-2.0
