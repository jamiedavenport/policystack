---
title: "@policystack/vite"
description: "Static AST detection of cookie writes and vendor scripts"
product: consent
---

Static cookie and vendor detection for Consent. Scans your source for
known third-party scripts and the cookies they (or your code) set.

The scanner is a pure library. The Vite plugin (`@policystack/vite`) and
the audit CLI (`@policystack/cli`) are built on top of it.

## Install

```sh
bun add -D @policystack/vite
```

## Usage

```ts
import { scan } from "@policystack/vite";

const result = await scan({ cwd: process.cwd() });
console.log(result.cookies); // Cookie[]
console.log(result.vendors); // VendorHit[]
console.log(result.ungated); // Ungated[]
```

`ScanOptions`:

| field         | default                                                              | notes                              |
| ------------- | -------------------------------------------------------------------- | ---------------------------------- |
| `cwd`         | required                                                             | the project root                   |
| `include`     | `**/*.{js,jsx,ts,tsx,vue,svelte,mjs,cjs,mts,cts}`                    | tinyglobby patterns                |
| `exclude`     | `node_modules`, `dist`, `.next`, `.svelte-kit`, `coverage`, `*.d.ts` | tinyglobby patterns                |
| `rules`       | every built-in rule                                                  | override to run a subset           |
| `vendors`     | bundled registry                                                     | override or extend the vendor list |
| `concurrency` | `os.availableParallelism()`                                          | per-file workers                   |

## What it detects

| Rule                | Pattern                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `document-cookie`   | `document.cookie = "..."`                                                  |
| `js-cookie`         | `Cookies.set/...` from `js-cookie`                                         |
| `cookies-next`      | `setCookie(...)` from `cookies-next` or `nookies`                          |
| `react-cookie`      | the setter from `useCookies()`                                             |
| `next-headers`      | `cookies().set(...)` from `next/headers`                                   |
| `set-cookie-header` | `Set-Cookie` in a `Response` / `Headers` / `NextResponse`                  |
| `vendor-imports`    | imports, dynamic imports, and global calls for the bundled vendor registry |

The bundled vendor registry covers Google Analytics / Tag Manager, Meta Pixel,
PostHog, Segment, Mixpanel, Hotjar, Intercom, LinkedIn Insight, Twitter/X
Pixel, TikTok Pixel, Reddit Pixel, Sentry, and Datadog. Pass `vendors:` to
extend or replace it.

## Suppression comments

```ts
// consent-ignore-next-line
document.cookie = "experiment=on";
```

```ts
// consent-ignore-file
// — placed in the first 10 lines, suppresses all hits in this file.
```

## The "ungated" heuristic

A hit is reported as **ungated** when the scanner cannot find evidence that it
runs only after the user has consented. The heuristic is intentionally
conservative — it favours false negatives over false positives.

A hit is treated as gated when any ancestor in its AST path is one of:

- a JSX element named `<ConsentGate>`
- an `if` / ternary whose test contains a `.has(...)` call (matches both
  `consent.has("analytics")` and `cookies.has("session")`)
- a function named `acceptAll`, `acceptNecessary`, or any name beginning with
  `set` (catches the common `setSessionCookie` / `setLocaleCookie` shape)

This is _not_ a control-flow analysis. Treat the `ungated` array as a
"please double-check" list, not a definitive enforcement signal — the runtime
is what enforces consent. See [Consent core] for the runtime story.

[Consent core]: ../core/README.md

## Custom rules

```ts
import { defineRule, scan, defaultRules } from "@policystack/vite";

const banPlausible = defineRule({
	name: "plausible-import",
	visit: (ctx) => {
		if (ctx.node.type !== "ImportDeclaration") return;
		const src = (ctx.node as { source?: { value?: string } }).source?.value;
		if (src === "plausible-tracker") {
			const { line, column } = ctx.position(ctx.node.start);
			ctx.report({
				file: ctx.file,
				line,
				column,
				vendor: "plausible",
				category: "analytics",
				via: "import",
			});
		}
	},
});

await scan({ cwd: process.cwd(), rules: [...defaultRules, banPlausible] });
```

## Vendor registry contributions

The bundled list lives in [`src/vendors.json`](./src/vendors.json). Each
entry has the shape:

```json
{
	"vendor": "stripe",
	"category": "payments",
	"imports": ["@stripe/stripe-js", "stripe"],
	"globals": ["Stripe"],
	"scriptUrls": ["https://js.stripe.com/v3/"]
}
```

PRs that add or correct entries are welcome. Please include a one-liner about
the categorisation in your commit message; the categories are deliberately
informal and align loosely with the GDPR/CCPA buckets the runtime uses.

## Tests

`bun test` (or `vp test`) runs:

- per-rule fixtures under `__fixtures__/rules/<rule>/`
- integrated synthetic projects under `__fixtures__/projects/`
- hand-authored real-world snippets under `__fixtures__/real-world/`
- a 1000-file synthetic perf assertion (must complete in under 2s)

`OPENCOOKIES_REAL_WORLD=1 vp test` additionally downloads pinned tarballs of
Cal.com and Documenso into `tests/real-world/.cache/` (gitignored) and
runs the scanner against them, asserting zero false positives on a curated
allowlist of known-clean files. The cache is reused across runs.

## See also

- [`@policystack/vite`](/docs/consent/vite) — Vite plugin that runs the scanner during dev and CI (recommended; you usually don't call the scanner directly)
- [`@policystack/cli`](/docs/consent/cli) — terminal entry point for one-off scans and config sync
- [`@policystack/core/consent`](/docs/consent/core) — runtime that actually enforces the consent decisions the scanner is checking for

## License

Apache-2.0
