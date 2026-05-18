---
title: "PolicyStack Consent"
description: "Open-source primitives for building cookie banners and preferences"
product: consent
---

Open-source primitives for building cookie banners and preferences.

**Consent logic, not consent UI.**

PolicyStack Consent gives you a tiny, headless state machine and framework-native hooks for managing user consent. You write the banner. We handle the rules.

## Why?

Most consent libraries ship a banner with the logic baked in. You either bend your design to match theirs or fight the library every step of the way.

PolicyStack Consent takes the opposite approach. The state machine, expressions, storage, and script gating are all yours to use — the UI is whatever you build around them.

## Install

```sh
# React
npm install @policystack/core/consent @policystack/react/consent

# Vue
npm install @policystack/core/consent @policystack/vue/consent

# Solid
npm install @policystack/core/consent @policystack/solid

# Svelte
npm install @policystack/core/consent @policystack/svelte/consent

# Angular
npm install @policystack/core/consent @policystack/angular
```

## Quick start

```tsx
import { PolicyStackConsentProvider, useConsent, ConsentGate } from "@policystack/react/consent";

const config = {
	categories: [
		{ key: "essential", label: "Essential", locked: true },
		{ key: "analytics", label: "Analytics" },
		{ key: "marketing", label: "Marketing" },
	],
};

function App() {
	return (
		<PolicyStackConsentProvider config={config}>
			<YourApp />
			<CookieBanner />
		</PolicyStackConsentProvider>
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

// Gate third-party code on consent
<ConsentGate requires="analytics">
	<GoogleAnalytics />
</ConsentGate>;
```

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
import openCookies from "@policystack/vite";

export default {
	plugins: [openCookies({ mode: "warn" })],
};
```

The plugin scans your code for cookie writes and known third-party vendors, and flags any that aren't behind a `ConsentGate` or `has()` check.

## Packages

| Package                                               | Description                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`@policystack/core/consent`](/docs/consent/core)     | Headless consent store, GPC handling, jurisdiction resolvers, script gating, storage adapters       |
| [`@policystack/react/consent`](/docs/consent/react)   | React 18+ adapter — `useConsent`, `useCategory`, `<ConsentGate>`                                    |
| [`@policystack/vue/consent`](/docs/consent/vue)       | Vue 3 adapter — plugin or `<PolicyStackConsentProvider>`, composables, `<ConsentGate>`              |
| [`@policystack/solid`](/docs/consent/solid)           | Solid adapter — signals-based hooks and provider                                                    |
| [`@policystack/svelte/consent`](/docs/consent/svelte) | Svelte 5 runes adapter (+ Svelte 4 `Readable` fallback at `/stores`)                                |
| [`@policystack/angular`](/docs/consent/angular)       | Angular 18+ adapter — `providePolicyStackConsent`, `ConsentService`, `injectCategory`, `*ocConsent` |
| [`@policystack/vite`](/docs/consent/scanner)          | Static AST detection of cookie writes and vendor scripts                                            |
| [`@policystack/vite`](/docs/consent/vite)             | Vite plugin: surfaces ungated cookie / vendor calls in dev and CI                                   |
| [`@policystack/cli`](/docs/consent/cli)               | Terminal UI for scans and config sync _(scaffold)_                                                  |
| [`@policystack/scripts`](/docs/consent/scripts)       | Pre-built script integrations: GA4, Meta Pixel, PostHog, Segment, GTM, Hotjar                       |

Until a docs site lands, each package README is the canonical reference. Shared concepts (categories, GPC, jurisdiction, re-consent triggers, script gating, storage adapters) live in [`@policystack/core/consent`](/docs/consent/core); the framework adapters are thin wrappers over it.

## Companion to PolicyStack

PolicyStack Consent pairs with [PolicyStack](https://policystack.dev) for the full privacy story: a single config drives your cookie banner, your cookie policy document, and your privacy policy disclosures. They work great together — and just as well apart.

## Status

Pre-1.0 and under active development. APIs may change before v1. Track progress on the [roadmap](https://github.com/jamiedavenport/policystack/issues).

## License

[Apache-2.0](https://github.com/jamiedavenport/policystack/blob/main/LICENSE)
