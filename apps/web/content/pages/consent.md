# Consent

> A headless consent state machine.

Tiny core. Adapters for every major framework. A Vite plugin that yells at you when a script sets a cookie behind a category the user hasn't accepted yet.

```tsx
import { PolicyStack } from "@policystack/react/provider";
import { ConsentGate } from "@policystack/react/consent";
import config from "./policystack";

// One config. <PolicyStack> derives the consent categories from
// config.cookies — no separate categories array, no conversion step.
export function App() {
	return (
		<PolicyStack config={config}>
			<YourApp />
			<ConsentGate requires="analytics">
				<GoogleAnalytics />
			</ConsentGate>
		</PolicyStack>
	);
}
```

## What it does

- **Headless core** — A state machine that tracks categories, persists choices, and emits events. The UI is whatever you build.
- **Framework adapters** — First-class hooks for React, Vue, Solid, Svelte, and Angular. Same store, same events, framework-idiomatic API.
- **Vite plugin** — Watches for cookie writes during dev. Throws if a script sets a cookie behind a category the user hasn't accepted.
- **Static scanner** — CI step that scans built bundles for ungated cookie usage so things don't regress between releases.
- **Integrations** — GA, Meta Pixel, GTM, Hotjar, PostHog — load them gated behind the right consent category by default.
- **CLI (planned)** — Bootstrap a config from your existing cookies, audit a deployed site, generate a per-environment policy.

## Catch leaky cookies before users do

The Vite plugin patches `document.cookie` in dev and refuses writes that fall outside the categories the user has accepted — with a stack trace pointing at the line that did it.

```
[policystack] ungated cookie write blocked
  cookie:    _ga
  category:  analytics  (not accepted)
  source:    src/lib/analytics.ts:18:5
  fix:       guard with consent.has("analytics")
```

## Install

```bash
pnpm add @policystack/core @policystack/react
```

```tsx
import { useConsent } from "@policystack/react/consent";

export function CookieBanner() {
	const { acceptAll, acceptNecessary } = useConsent();
	return (
		<div>
			<button onClick={acceptAll}>Accept all</button>
			<button onClick={acceptNecessary}>Necessary only</button>
		</div>
	);
}
```

## See also

- [Docs: Consent](https://policystack.dev/docs/consent.md)
- [Policy](https://policystack.dev/policy.md) — wire them together
- GitHub: <https://github.com/jamiedavenport/policystack>
