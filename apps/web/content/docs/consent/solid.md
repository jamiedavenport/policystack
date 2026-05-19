---
title: "@policystack/solid"
description: "Solid adapter — one PolicyStack provider, signals-based hooks"
product: consent
---

Solid adapter for Consent. Built on Solid's signals — fine-grained reactivity with no virtual DOM cost. Wraps [`@policystack/core/consent`](/docs/consent/core).

## Install

```sh
bun add @policystack/core @policystack/solid
```

Peer dependencies: `solid-js >= 1.8`.

## Setup

There is **one** provider. Wrap your app with `<PolicyStack>` and pass it your whole `policystack.ts` config — the consent categories (and their locked vs. consent-gated state) are derived from `config.cookies`; there is no separate categories array, no conversion step.

```tsx
import { PolicyStack } from "@policystack/solid/consent";
import { render } from "solid-js/web";
import config from "./policystack";

render(
	() => (
		<PolicyStack config={config}>
			<App />
		</PolicyStack>
	),
	document.getElementById("root")!,
);
```

`useConsent` / `useCategory` / `<ConsentGate>` read the store from this same provider. A policy-only config (no `cookies`) provides no store, so a consent hook used under it throws — that is a configuration error, not a runtime state.

## API

### `useConsent()`

Returns an object of accessors (call as functions) plus action methods.

```tsx
import { useConsent } from "@policystack/solid/consent";
import { Show } from "solid-js";

function Banner() {
	const { route, acceptAll, acceptNecessary, setRoute } = useConsent();
	return (
		<Show when={route() === "cookie"}>
			<div class="banner">
				<button onClick={acceptNecessary}>Necessary only</button>
				<button onClick={acceptAll}>Accept all</button>
				<button onClick={() => setRoute("preferences")}>Customize</button>
			</div>
		</Show>
	);
}
```

### `useCategory(key)`

Granular per-category access.

```tsx
import { useCategory } from "@policystack/solid/consent";

function AnalyticsToggle() {
	const analytics = useCategory("analytics");
	return (
		<label>
			<input type="checkbox" checked={analytics.granted()} onChange={analytics.toggle} />
			Analytics
		</label>
	);
}
```

### `<ConsentGate>`

Renders `children` when an expression is satisfied; renders `fallback` otherwise.

```tsx
import { ConsentGate } from "@policystack/solid/consent";

<ConsentGate requires="analytics" fallback={<EnablePrompt />}>
  <Chart />
</ConsentGate>

<ConsentGate requires={{ and: ["analytics", "marketing"] }}>
  <PersonalizedPromo />
</ConsentGate>
```

## SolidStart (SSR)

`<PolicyStack>` works in SolidStart — call it from your `app.tsx` root:

```tsx
// src/app.tsx
import { PolicyStack } from "@policystack/solid/consent";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import config from "./policystack";

export default function App() {
	return (
		<PolicyStack config={config}>
			<Router>
				<FileRoutes />
			</Router>
		</PolicyStack>
	);
}
```

For SSR-resolved decisions, author a storage adapter under `config.consent` — the cookie/header adapters from [`@policystack/core/consent`](/docs/consent/core) restore decisions at init. The same one config drives it.

## Bundling

This package ships source via the `solid` export condition, so consumers using `vite-plugin-solid` (Vite, SolidStart, Astro) will compile the components in their own pipeline.

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating (`gateScript`), and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the Solid adapter is a thin reactivity wrapper.

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — React, Vue, Svelte

## License

Apache-2.0
