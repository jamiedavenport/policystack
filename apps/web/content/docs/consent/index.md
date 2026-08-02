---
title: "Consent"
description: "Open-source primitives for building cookie banners and preferences"
product: consent
---

Open-source primitives for building cookie banners and preferences.

**Consent logic, not consent UI.**

Consent gives you a tiny, headless state machine and framework-native hooks for managing user consent. You write the banner. We handle the rules.

## Why?

Most consent libraries ship a banner with the logic baked in. You either bend your design to match theirs or fight the library every step of the way.

Consent takes the opposite approach. The state machine, expressions, storage, and script gating are all yours to use — the UI is whatever you build around them.

## Install

```sh
# React
npm install @policystack/core @policystack/react

# Vue
npm install @policystack/core @policystack/vue

# Solid
npm install @policystack/core @policystack/solid

# Svelte
npm install @policystack/core @policystack/svelte

# Angular
npm install @policystack/core @policystack/angular
```

## Quick start

There is **one** provider. Pass it your whole `policystack.ts` config — the consent categories are derived from `config.cookies`, so you never hand-roll a categories array.

```tsx
import { PolicyStack } from "@policystack/react/provider";
import { useConsent, ConsentGate } from "@policystack/react/consent";
import config from "./policystack";

function App() {
	return (
		<PolicyStack config={config}>
			<YourApp />
			<CookieBanner />
		</PolicyStack>
	);
}

function CookieBanner() {
	const { route, acceptAll, acceptNecessary, setRoute } = useConsent();
	if (route !== "cookie") return null;

	return (
		<div className="your-styles-here">
			<p>We use cookies to improve your experience.</p>
			<button onClick={acceptAll}>Accept all</button>
			<button onClick={acceptNecessary}>Necessary only</button>
			<button onClick={() => setRoute("preferences")}>Customise</button>
		</div>
	);
}

function CookiePreferences() {
	const { categories } = useConsent();
	return categories.map((category) => (
		<label key={category.key}>
			{category.label}
			{category.description && <span>{category.description}</span>}
		</label>
	));
}

// Gate third-party code on consent
<ConsentGate requires="analytics">
	<GoogleAnalytics />
</ConsentGate>;
```

Category `label`, `description`, and `respectGPC` values come from `cookies.context`. Missing copy uses the built-in cookie-type dictionary for the policy locale, so preference UIs do not need their own category-copy table.

## Features

- **Headless** — no styles, no DOM, no opinions about how your banner looks
- **Hooks-first** — same API across React, Vue, Solid, and Svelte, translated to native reactivity
- **Tiny** — core under 4kb gzipped, framework adapters under 1.5kb
- **Pluggable storage** — localStorage, cookies, or your own server
- **Jurisdiction-aware** — different defaults for EEA, UK, US states, and more
- **Script gating** — load third-party tags only after consent, with pre-built integrations for GA4, Meta Pixel, PostHog, Segment, and others
- **GPC support** — honours the Global Privacy Control signal out of the box
- **Versioned consent records** — re-prompt automatically when your policy changes
- **Vite plugin** — detects ungated cookie usage at build time and warns before you ship

## Vite plugin

```ts
// vite.config.ts
import { policyStack } from "@policystack/vite";

export default {
	plugins: [policyStack({ consent: { mode: "warn" } })],
};
```

One plugin covers both products. The opt-in `consent` option turns on the cookie scanner: it scans your code for cookie writes and known third-party vendors, and flags any that aren't behind a `ConsentGate` or `has()` check.

## Packages

| Package                                               | Description                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`@policystack/core/consent`](/docs/consent/core)     | Headless consent store, GPC handling, jurisdiction resolvers, script gating, storage adapters       |
| [`@policystack/react/consent`](/docs/consent/react)   | React 18+ adapter — one `<PolicyStack>` provider, `useConsent`, `useCategory`, `<ConsentGate>`      |
| [`@policystack/vue/consent`](/docs/consent/vue)       | Vue 3 adapter — one `<PolicyStack>` provider, composables, `<ConsentGate>`                          |
| [`@policystack/solid`](/docs/consent/solid)           | Solid adapter — one `<PolicyStack>` provider, signals-based hooks                                   |
| [`@policystack/svelte/consent`](/docs/consent/svelte) | Svelte 5 runes adapter (+ Svelte 4 `Readable` fallback at `/stores`)                                |
| [`@policystack/angular`](/docs/consent/angular)       | Angular 18+ adapter — `providePolicyStackConsent`, `ConsentService`, `injectCategory`, `*ocConsent` |
| [`@policystack/vite`](/docs/consent/scanner)          | Static AST detection of cookie writes and vendor scripts                                            |
| [`@policystack/vite`](/docs/consent/vite)             | Vite plugin: surfaces ungated cookie / vendor calls in dev and CI                                   |
| [`@policystack/cli`](/docs/consent/cli)               | Terminal UI for scans and config sync _(scaffold)_                                                  |
| [`@policystack/scripts`](/docs/consent/scripts)       | Pre-built script integrations: GA4, Meta Pixel, PostHog, Segment, GTM, Hotjar                       |

Shared concepts (categories, GPC, jurisdiction, re-consent triggers, script gating, storage adapters) live in [`@policystack/core/consent`](/docs/consent/core); the framework adapters are thin wrappers over it.

## Companion to Policy

Consent pairs with [Policy](https://policystack.dev) for the full privacy story: a single config drives your cookie banner, your cookie policy document, and your privacy policy disclosures. They work great together — and just as well apart.

## Status

Stable as of 1.0 — the public surface (the consent store, expressions, and the slot contract) is frozen, and changes follow semver. Track progress on the [roadmap](https://github.com/jamiedavenport/policystack/issues).

## License

[Apache-2.0](https://github.com/jamiedavenport/policystack/blob/main/LICENSE)
