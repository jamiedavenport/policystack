---
title: Cookie banner
description: The cookie banner and consent runtime now live in the Consent project.
product: policy
---

The cookie banner, preferences panel, and consent runtime previously shipped as part of Policy have moved to a sibling project: **Consent**.

> [github.com/jamiedavenport/policystack](https://github.com/jamiedavenport/policystack)

Consent and Policy are designed to work together: the same `cookies` config in your `policystack.ts` drives both the cookie _policy_ (the legal document) and the cookie _banner_ (the consent UI).

## What stayed in Policy

Policy still generates the **cookie policy** — the legal document describing the cookies your application uses. See [Policies → Cookie policy](/docs/policy/policies/cookies) for how to render it via `<CookiePolicy />`.

## What moved to Consent

- The `<CookieBanner />` and `<CookiePreferences />` components.
- The `useCookies()` hook and `<ConsentGate>` component.
- Consent storage, cross-tab sync, and the `data-consent-*` body attributes.

## Wire them together

`@policystack/sdk/consent` exports `toPolicyStackConsentConfig(policy)` which translates `policy.cookies.used` into an `PolicyStackConsentConfig` — the `categories` array, with `essential` automatically locked and labels capitalized. You don't hand-roll the category list a second time next to your banner.

```tsx
import { PolicyStackConsentProvider } from "@policystack/react/consent";
import { toPolicyStackConsentConfig } from "@policystack/sdk/consent";
import policy from "./policy";

export function Root({ children }: { children: React.ReactNode }) {
	return (
		<PolicyStackConsentProvider config={toPolicyStackConsentConfig(policy)}>
			{children}
		</PolicyStackConsentProvider>
	);
}
```

The bridge also defaults `PolicyStackConsentConfig.policyVersion` from `policy.cookieVersion` — so `triggers.policyVersionChanged` reprompts consent when (and only when) the cookie slice of your config actually changes. Pass `options` to override anything: `toPolicyStackConsentConfig(policy, { policyVersion: "v3", storage: customStorage })`.

The bridge uses a type-only import from `@policystack/core/consent`, declared as an optional peer dependency. If you don't render a banner, you pay nothing.

For everything else — categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating — see the [Consent docs](/docs/consent).
