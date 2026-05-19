# `@policystack/renderers`

> Shared policy render layer for [PolicyStack](https://policystack.dev).

Turns the `Document` AST produced by `@policystack/core` into Markdown, HTML, or
PDF. This is the layer the official framework integrations build on; most apps
render via `@policystack/sdk` or a framework package and never import this
directly.

## What it does

- `compilePolicy(config, type, options)` — compile a `PolicyStackConfig` and a
  policy type (`"privacy"` | `"cookie"`) straight to rendered output in memory.
- One shared `visit()`-based pass per format, so Markdown, HTML, and PDF can't
  disagree about how a node renders.
- Output is in-memory only: `string` for Markdown/HTML, `Buffer` for PDF. Never
  written to disk — the caller decides what to do with it.

## Usage

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
- [npm](https://www.npmjs.com/package/@policystack/renderers)
