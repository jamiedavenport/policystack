# `@policystack/core`

> Compilation engine for [PolicyStack](https://policystack.dev) policy documents.

This is an internal package used by `@policystack/sdk`, `@policystack/vite`, and `@policystack/cli`. You generally do not need to install or import it directly.

## What it does

- Compiles `PrivacyPolicyConfig` and `CookiePolicyConfig` definitions to an in-memory document tree
- Renders that tree to Markdown, HTML, or PDF **strings** (PDF is a `Buffer`) — never to disk
- Validates policy configs and returns structured warnings and errors
- Exports section builders, renderers, and all core types

## Direct usage

If you're building a custom integration (e.g. a framework plugin not covered by the official packages), compile the document tree from a `PolicyStackConfig` with `compilePrivacyPolicy` / `compileCookiePolicy` (each returns a `Document` tree, or `null` when that policy is not emitted):

```ts
import { compilePrivacyPolicy } from "@policystack/core";

const doc = compilePrivacyPolicy({
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	company: {
		name: "Acme",
		legalName: "Acme, Inc.",
		address: "...",
		contact: { email: "privacy@acme.com" },
	},
	// ... rest of config
});
// doc is a Document AST you can render however you like, or null.
```

To render straight to strings/PDF in memory, use `compilePolicy` from `@policystack/renderers` — it takes the same flat config plus the policy type, and the caller decides what to do with the output (inject into a page, send over the wire, write to disk, etc.):

```ts
import { compilePolicy } from "@policystack/renderers";

const results = await compilePolicy(
	{
		effectiveDate: "2026-01-01",
		jurisdictions: ["eea"],
		company: {
			name: "Acme",
			legalName: "Acme, Inc.",
			address: "...",
			contact: { email: "privacy@acme.com" },
		},
		// ... rest of config
	},
	"privacy",
	{ formats: ["markdown", "html", "pdf"] },
);

for (const result of results) {
	// result.content is string for markdown/html, Buffer for pdf
	console.log(result.format, result.content);
}
```

## Links

- [GitHub](https://github.com/jamiedavenport/policystack)
- [policystack.dev](https://policystack.dev)
- [npm](https://www.npmjs.com/package/@policystack/core)
