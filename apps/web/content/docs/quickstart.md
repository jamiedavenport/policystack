---
title: Add privacy policies and cookie consent to React
description: Install PolicyStack V1, define a shared TypeScript config, render a privacy policy, and collect an analytics consent choice in React 18 or later.
lastModified: 2026-09-06
sidebar:
  label: React quickstart
---

This PolicyStack V1 quickstart adds a privacy policy and a minimal consent choice UI to an existing React 18+ TypeScript application. PolicyStack supplies the state and renderers; you own the banner design and accessibility.

## Install the packages

```sh
pnpm add @policystack/sdk@1 @policystack/core@1 @policystack/react@1
```

Alternatively, `pnpm dlx @policystack/cli@1 init` scaffolds a starter config and an agent reference. The manual example below is complete and uses fictional company details: replace them with your reviewed disclosures.

## Define a shared configuration

Create `policystack.ts`:

```ts
import { ContractPrerequisite, defineConfig, LegalBases } from "@policystack/sdk";

export default defineConfig({
	company: {
		name: "Acme",
		legalName: "Acme Ltd",
		address: "1 High Street, London",
		url: "https://acme.example",
		contact: { email: "privacy@acme.example" },
	},
	effectiveDate: "2026-09-06",
	jurisdictions: ["eea", "uk"],
	data: {
		collected: { Account: ["Email address"] },
		context: {
			Account: {
				purpose: "Create and operate an account",
				lawfulBasis: LegalBases.Contract,
				retention: "Until account deletion",
				provision: ContractPrerequisite("An account cannot be created without it."),
			},
		},
	},
	cookies: {
		used: { essential: true, analytics: true },
		context: {
			essential: { lawfulBasis: LegalBases.LegalObligation },
			analytics: { lawfulBasis: LegalBases.Consent },
		},
	},
});
```

Company values are explicit: V1 does not populate them from `package.json`. Use [configuration guidance](/docs/policy/configuration) and validation to review jurisdiction-dependent disclosures before publishing.

## Render the policy and consent controls

Create or replace `App.tsx`:

```tsx
import { PolicyStack } from "@policystack/react/provider";
import { PrivacyPolicy } from "@policystack/react/policy";
import { ConsentGate, useConsent } from "@policystack/react/consent";
import policy from "./policystack";

function ConsentControls() {
	const { route, acceptAll, acceptNecessary, setRoute } = useConsent();
	return (
		<section aria-label="Cookie consent">
			{route === "cookie" ? (
				<>
					<p>Allow optional analytics or use necessary cookies only.</p>
					<button onClick={() => acceptAll()}>Accept all</button>
					<button onClick={() => acceptNecessary()}>Necessary only</button>
				</>
			) : (
				<button onClick={() => setRoute("cookie")}>Change cookie choice</button>
			)}
		</section>
	);
}

export default function App() {
	return (
		<PolicyStack config={policy}>
			<ConsentControls />
			<ConsentGate requires="analytics" fallback={<p>Analytics is off.</p>}>
				<p>Analytics consent has been granted.</p>
			</ConsentGate>
			<PrivacyPolicy />
		</PolicyStack>
	);
}
```

## Verify the behaviour

With no saved choice, the optional analytics gate is closed. Accept all opens it; necessary only keeps it closed. Change the choice to reject after accepting and the gate closes again. The privacy document renders from the same configuration.

The example displays a consent state, not a tracking script. To load a real vendor, use [GatedScript and the script factories](/docs/consent/scripts). Closing a gate does not unload an already executed vendor script: implement the vendor's opt-out/reset behaviour where needed. See [storage and SSR](/docs/consent/core) when persisting choices or rendering on the server.

## Next steps

- [Render a cookie policy or export Markdown](/docs/policy/policies/quick-start).
- [Build a preferences panel with useCategory](/docs/consent/react).
- [Detect ungated analytics in Vite](/docs/consent/vite).
- [Validate your configuration and connect MCP](/docs/policy/cli).

Implementation: [React consent bindings](https://github.com/jamiedavenport/policystack/tree/main/packages/react/src), [core consent store](https://github.com/jamiedavenport/policystack/tree/main/packages/core/src/consent).
