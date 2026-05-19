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

There is no separate consent config and no conversion step. The single `<PolicyStack>` provider takes your whole `policystack.ts` config and derives the consent categories from `policy.cookies.used` — with `essential` automatically locked and labels capitalized. You don't hand-roll the category list a second time next to your banner.

```tsx
import { PolicyStack } from "@policystack/react/provider";
import policy from "./policy";

export function Root({ children }: { children: React.ReactNode }) {
	return <PolicyStack config={policy}>{children}</PolicyStack>;
}
```

The provider also defaults the consent `policyVersion` from `policy.cookieVersion` — so `triggers.policyVersionChanged` reprompts consent when (and only when) the cookie slice of your config actually changes. Author any runtime-only overrides (storage adapter, jurisdiction resolver, GPC, triggers) under `policy.consent`.

A policy-only config (no `cookies`) creates no consent store — if you don't declare cookies, you pay nothing and the consent hooks stay inert.

For everything else — categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating — see the [Consent docs](/docs/consent).
