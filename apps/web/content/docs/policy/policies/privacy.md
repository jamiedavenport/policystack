---
title: Privacy Policy
description: Generate and render a privacy policy from your policystack.ts config
product: policy
---

See the [Quick Start](/docs/policy/policies/quick-start) to add a privacy policy page to your app.

Add the `data` block to your config — the privacy policy is auto-detected from its presence. User rights (access, erasure, portability, etc.) are derived automatically from your `jurisdictions`:

```ts
// policystack.ts
import { ContractPrerequisite, defineConfig, LegalBases, Voluntary } from "@policystack/sdk";

effectiveDate: "2026-01-01",
jurisdictions: ["eu", "us-ca"],
data: {
  collected: {
    "Account Information": ["Name", "Email address"],
    "Usage Data": ["Pages visited", "IP address"],
  },
  context: {
    "Account Information": {
      purpose: "To authenticate users and send service notifications",
      lawfulBasis: LegalBases.Contract,
      retention: "Until account deletion",
      provision: ContractPrerequisite("We cannot create or operate your account."),
    },
    "Usage Data": {
      purpose: "To understand product usage and improve the service",
      lawfulBasis: LegalBases.LegitimateInterests,
      retention: "90 days",
      provision: Voluntary("None — your service is unaffected."),
    },
  },
},
thirdParties: [],
automatedDecisionMaking: [],
```

Set `automatedDecisionMaking: []` to declare that you don't use automated decision-making or profiling (GDPR Art. 13(2)(f) / Art. 22). To declare activities, list each with `name`, `logic`, and `significance` — see [Configuration](/docs/policy/configuration#automated-decision-making-and-profiling).

`data.collected` lists the field labels per category, and `data.context[category]` carries the metadata: `purpose`, `lawfulBasis`, `retention`, and `provision`. Every category in `data.collected` must have a matching `context` entry — `defineConfig` enforces this at type-check time, and the `policyStack()` Vite plugin re-validates it at build time. The renderer joins them into a single Article 13(1)(c) line per category: **Account Information** — used for [purpose] — [Article 6 basis], and emits a separate Article 13(2)(e) section disclosing whether each category is required, contractual, a contract-prerequisite, or voluntary, with the consequences of refusal. With auto-collect, the plugin emits `policystack.gen.ts` alongside your config — commit it so the same constraint applies to scanned categories in CI.

`data.collected` and `thirdParties` can also be populated automatically — see [Auto-collect](/docs/policy/policies/auto-collect).

`defineConfig` computes a `privacyVersion` — an 8-char hash scoped to the privacy slice of your config — which is printed in the intro paragraph next to the effective date. Edits to cookie-only fields do not invalidate it. See [Policy versions](/docs/policy/configuration#policy-versions).

Then render it:

```tsx
import { PolicyStack } from "@policystack/react/provider";
import { PrivacyPolicy } from "@policystack/react/policy";
import policy from "@/policy";

export function PrivacyPolicyPage() {
	return (
		<PolicyStack config={policy}>
			<PrivacyPolicy />
		</PolicyStack>
	);
}
```
