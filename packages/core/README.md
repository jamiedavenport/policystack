# `@openpolicy/core`

> Compilation engine for [OpenPolicy](https://openpolicy.sh) policy documents.

This is an internal package used by `@openpolicy/sdk`, `@openpolicy/vite`, and `@openpolicy/cli`. You generally do not need to install or import it directly.

## What it does

- Compiles `PrivacyPolicyConfig` and `CookiePolicyConfig` definitions to an in-memory document tree
- Renders that tree to Markdown, HTML, or PDF **strings** (PDF is a `Buffer`) — never to disk
- Validates policy configs and returns structured warnings and errors
- Exports section builders, renderers, and all core types

## Direct usage

If you're building a custom integration (e.g. a framework plugin not covered by the official packages), you can use `compilePolicy` directly. It returns the rendered output in memory — the caller decides what to do with it (inject into a page, send over the wire, write to disk, etc.).

```ts
import { compilePolicy } from "@openpolicy/core";

const results = await compilePolicy(
	{
		type: "privacy",
		effectiveDate: "2026-01-01",
		company: {
			name: "Acme",
			legalName: "Acme, Inc.",
			address: "...",
			contact: { email: "privacy@acme.com" },
		},
		// ... rest of config
	},
	{ formats: ["markdown", "html", "pdf"] },
);

for (const result of results) {
	// result.content is string for markdown/html, Buffer for pdf
	console.log(result.format, result.content);
}
```

## Links

- [GitHub](https://github.com/jamiedavenport/openpolicy)
- [openpolicy.sh](https://openpolicy.sh)
- [npm](https://www.npmjs.com/package/@openpolicy/core)
