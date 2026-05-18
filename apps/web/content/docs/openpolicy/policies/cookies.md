---
title: Cookie Policy
description: Generate and render a cookie policy from your policystack.ts config
product: openpolicy
---

See the [Quick Start](/docs/openpolicy/policies/quick-start) to add a cookie policy page to your app.

Add cookie fields to your config — the cookie policy is auto-detected from the presence of the `cookies` (or `trackingTechnologies`) field:

```ts
// policystack.ts
import { defineConfig, LegalBases } from "@policystack/sdk";

effectiveDate: "2026-01-01",
jurisdictions: ["eu", "us-ca"],
cookies: {
  used: {
    essential: true,
    analytics: true,
    functional: false,
    marketing: false,
  },
  context: {
    essential: { lawfulBasis: LegalBases.LegalObligation },
    analytics: { lawfulBasis: LegalBases.Consent },
    functional: { lawfulBasis: LegalBases.Consent },
    marketing: { lawfulBasis: LegalBases.Consent },
  },
},
thirdParties: [
  {
    name: "Google Analytics",
    purpose: "Website analytics and performance monitoring",
    policyUrl: "https://policies.google.com/privacy",
  },
],
```

The consent mechanism (banner / preference panel / withdrawal) is **derived** from this cookie posture — any consent-gated category yields all three — so it is no longer authored. It surfaces in the cookie policy's consent section automatically.

`cookies.used` always requires `essential: true`; other keys are `boolean` and act as additional categories. Every key in `cookies.used` must have a matching Article 6 basis in `cookies.context[key].lawfulBasis` — `defineConfig` enforces this at type-check time, and the rendered "Cookies and Tracking" section appends the basis to each enabled category.

`defineConfig` also computes a `cookieVersion` — an 8-char hash of the cookie slice of your config — which is printed in the intro paragraph next to the effective date. See [Policy versions](/docs/openpolicy/configuration#policy-versions).

Then render it:

```tsx
import { OpenPolicy, CookiePolicy } from "@policystack/react";
import openpolicy from "@/openpolicy";

export function CookiePolicyPage() {
	return (
		<OpenPolicy config={openpolicy}>
			<CookiePolicy />
		</OpenPolicy>
	);
}
```

Looking to add a consent banner? See [Cookie Banner →](/docs/openpolicy/cookies/overview).
