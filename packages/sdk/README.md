# `@policystack/sdk`

> TypeScript SDK for defining privacy and cookie policies as code.

Part of [PolicyStack](https://policystack.dev) — a policy-as-code framework that compiles legal agreements from TypeScript at build time.

> **Not legal advice.** PolicyStack generates policy documents from your config. It does not provide legal advice. Have a lawyer review your policies before publication. See the [legal notice](https://policystack.dev/legal-notice).

## Install

```sh
bun add @policystack/sdk
# or: npm install @policystack/sdk
```

## Usage

### Privacy policy

```ts
// policystack.ts
import { ContractPrerequisite, defineConfig, LegalBases, Voluntary } from "@policystack/sdk";

export default defineConfig({
	company: {
		name: "Acme",
		legalName: "Acme, Inc.",
		address: "123 Main St, San Francisco, CA 94105",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eu", "us-ca"],
	data: {
		collected: {
			"Account information": ["Email address", "Display name"],
			"Usage data": ["Pages visited", "Session duration"],
		},
		context: {
			"Account information": {
				purpose: "To create and manage user accounts",
				lawfulBasis: LegalBases.Contract,
				retention: "Until account deletion",
				provision: ContractPrerequisite("We cannot create or operate your account."),
			},
			"Usage data": {
				purpose: "To understand product usage and improve the service",
				lawfulBasis: LegalBases.LegitimateInterests,
				retention: "13 months",
				provision: Voluntary("None — your service is unaffected."),
			},
		},
	},
	thirdParties: [
		{ name: "Vercel", purpose: "Hosting" },
		{ name: "Plausible", purpose: "Privacy-friendly analytics" },
	],
});
```

### Cookie policy

```ts
// policystack.ts
import { defineConfig, LegalBases } from "@policystack/sdk";

export default defineConfig({
	company: {
		name: "Acme",
		legalName: "Acme, Inc.",
		address: "123 Main St, San Francisco, CA 94105",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eu", "us-ca"],
	cookies: {
		used: { essential: true, analytics: true, marketing: false },
		context: {
			essential: { lawfulBasis: LegalBases.LegalObligation },
			analytics: { lawfulBasis: LegalBases.Consent },
			marketing: { lawfulBasis: LegalBases.Consent },
		},
	},
});
```

## Rendering policies

The SDK exports types and helper functions for _defining_ policies. To render them in your app, pair it with one of:

- **[`@policystack/react`](https://policystack.dev/docs)** — `<PrivacyPolicy />` / `<CookiePolicy />` components for React
- **[`@policystack/vue`](https://policystack.dev/docs)** — Vue 3 components
- **[`@policystack/vite`](https://policystack.dev/docs)** — Vite plugin that scans source for `collecting()` / `thirdParty()` annotations at build time
- **[`@policystack/cli`](https://policystack.dev/docs/cli)** — one-command project setup: installs the right packages, scaffolds a config, and prints a prompt for your coding agent

## Documentation

Full field reference and guides: [policystack.dev/docs](https://policystack.dev/docs)

## AI Agents

`openpolicy init` writes a type-accurate `policystack.llms.txt` into your project and prints a setup prompt — feed it to any coding agent (Claude Code, Cursor, Copilot, etc.).

For Claude Code, install the PolicyStack skill pack — guided procedures for setup, auditing, jurisdiction posture, and data-flow instrumentation, all resolved against the frozen SDK surface:

```
/plugin marketplace add jamiedavenport/policystack
/plugin install policystack
```

## Links

- [GitHub](https://github.com/jamiedavenport/policystack)
- [policystack.dev](https://policystack.dev)
- [npm](https://www.npmjs.com/package/@policystack/sdk)
