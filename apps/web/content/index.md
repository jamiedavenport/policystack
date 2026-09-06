---
title: Privacy and consent as code
description: Generate privacy policies and manage headless cookie consent from one typed TypeScript config with PolicyStack V1.
---

PolicyStack V1 turns one TypeScript configuration into privacy and cookie policies, plus a headless consent store. Keep your disclosures and consent categories together in code; render them in your own application and design system.

[Get started with V1](/docs/quickstart) · [Read the documentation](/docs) · [View the source](https://github.com/jamiedavenport/policystack)

## Start with your application

```sh
pnpm dlx @policystack/cli@1 init
```

The CLI scaffolds a configuration and generates a reference for your coding agent. Review the company details, declared data, purposes, retention, and jurisdictions before publication.

## One config, two capabilities

```tsx
import { PolicyStack } from "@policystack/react/provider";
import { PrivacyPolicy } from "@policystack/react/policy";
import { ConsentGate } from "@policystack/react/consent";
import policy from "./policystack";

export function PrivacyPage() {
	return (
		<PolicyStack config={policy}>
			<PrivacyPolicy />
			<ConsentGate requires="analytics">
				<p>Analytics consent has been granted.</p>
			</ConsentGate>
		</PolicyStack>
	);
}
```

Use the [complete quickstart](/docs/quickstart) for the configuration and a working consent choice UI.

- **Policy generation:** privacy and cookie documents, framework-native renderers, and Markdown, HTML, or PDF output.
- **Headless consent:** your banner and preferences UI, backed by a shared store, jurisdiction posture, and explicit script gates.
- **Development feedback:** source annotations and opt-in Vite scanning surface potential disclosure and consent gaps.
- **Agent tooling:** generated SDK reference, CLI validation, MCP tools, and reusable skills.

[Check framework support and limitations](/docs/reference/support). V1 packages are Apache-2.0. Generated documents require review; PolicyStack does not determine your legal obligations or guarantee compliance.

## What comes next

V2 is in design. The direction is a self-hostable platform connecting privacy inventory, consent, backend enforcement, and rights workflows. These capabilities are not shipped V1 features.

[Read the V2 roadmap](/docs/roadmap) · [Discuss becoming a design partner](mailto:jamie@policystack.dev)
