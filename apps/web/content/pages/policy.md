# Policy

> Your privacy policy, as a typed config.

Define your policy once in TypeScript. Render it as React components, generate Markdown, ship a consent banner — all driven from the same source of truth.

```ts
import { PolicyStack, PrivacyPolicy } from "@policystack/react";
import policy from "@/policy";

export function PrivacyPolicyPage() {
  return (
    <PolicyStack config={policy}>
      <PrivacyPolicy />
    </PolicyStack>
  );
}
```

## What you get

- **Typed config** — `definePolicy()` gives you autocomplete and type errors when something is missing or stale.
- **React renderer** — Drop-in components for the policy page, individual sections, and per-purpose data tables.
- **Markdown export** — Generate a static `.md` version for your repo, your docs site, or for the agents to consume.
- **Multilingual** — Render the same config in French, German, Dutch, or Spanish. The `locale` prop lets one config emit multiple languages side-by-side.
- **Consent banner** — A shadcn-style banner that reads from the same config — no copy drift between policy and UI.
- **Astro + Svelte** — Astro docs are first-class. A Svelte adapter is shipping. More frameworks on the roadmap.
- **Documents, not advice** — Built with privacy counsel review in mind — never as a replacement for it.

## Not a SaaS dashboard. Not a static template.

Same legal coverage you'd get from a lawyer, a template, or one of the incumbent SaaS tools — without the invoice, the dashboard, or the drift.

| Feature                                     | Policy | Lawyers  | Templates  | Termly      | iubenda       |
| ------------------------------------------- | ------ | -------- | ---------- | ----------- | ------------- |
| Developer workflow (Git, TypeScript, CI)    | ✓      | ✗        | ✗          | ✗           | ✗             |
| Version controlled                          | ✓      | ✗        | ✗          | ✗           | ✗             |
| Renders as a React / Vue / Svelte component | ✓      | ✗        | ✗          | ✗           | ✗             |
| Always in sync with the codebase            | ✓      | ✗        | ✗          | ✗           | ✗             |
| Markdown / HTML / PDF output                | ✓      | PDF only | Word / PDF | Hosted page | Hosted widget |
| GDPR + CCPA coverage                        | ✓      | ✓        | Varies     | ✓           | ✓             |
| No ongoing subscription                     | ✓      | ✗        | ✓          | ✗           | ✗             |
| Self-hostable / open source                 | ✓      | —        | —          | ✗           | ✗             |

GDPR and CCPA coverage is the floor — Policy is not legal advice and is not a replacement for counsel on high-stakes matters.

## Multilingual out of the box

Pass `locale` to `defineConfig` and the ~125 strings Policy emits — headings, table headers, GDPR/CCPA boilerplate, formatted dates — render in your chosen language. Your company name, processing purposes, retention text, and third-party descriptions pass through as you wrote them.

| Locale  | Tag  |
| ------- | ---- |
| English | `en` |
| French  | `fr` |
| German  | `de` |
| Dutch   | `nl` |
| Spanish | `es` |

```ts
import { defineConfig } from "@policystack/sdk";

export default defineConfig({
	company: { name: "Acme, Inc." },
	jurisdictions: ["eu", "fr"],
	locale: "fr",
	data: {
		/* ... */
	},
});
```

The React adapter also accepts a `locale` prop on `<PrivacyPolicy />` and `<CookiePolicy />`, so a single config can render multiple languages on the same page. Translated boilerplate is first-pass legal text — have local counsel sign off before relying on a non-English locale in production.

## Install

Two lines and you're shipping.

```bash
pnpm dlx @policystack/cli init
```

```ts
import { defineConfig } from "@policystack/sdk";

export default defineConfig({
	company: { name: "Acme, Inc." },
	jurisdictions: ["eu", "us-ca"],
	data: {
		collected: {
			"Account Information": ["Name", "Email"],
		},
	},
});
```

## See also

- [Docs: Policy](https://policystack.dev/docs/policy.md)
- [Consent](https://policystack.dev/consent.md) — pair with Policy for consent state
- GitHub: <https://github.com/jamiedavenport/policystack>
