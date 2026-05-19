---
title: "@policystack/solid"
description: "Solid adapter — signals-based hooks and provider"
product: consent
---

Solid adapter for Consent. Built on Solid's signals — fine-grained reactivity with no virtual DOM cost. Wraps [`@policystack/core/consent`](/docs/consent/core).

## Install

```sh
bun add @policystack/core/consent @policystack/solid
```

Peer dependencies: `solid-js >= 1.8`.

## Setup

Wrap your app with `<PolicyStackConsentProvider>`:

```tsx
import { PolicyStackConsentProvider } from "@policystack/solid";
import type { Category } from "@policystack/core/consent";
import { render } from "solid-js/web";

const categories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

render(
	() => (
		<PolicyStackConsentProvider config={{ categories }}>
			<App />
		</PolicyStackConsentProvider>
	),
	document.getElementById("root")!,
);
```

You can pass a pre-created store with `<PolicyStackConsentProvider store={store}>` instead.

## API

### `useConsent()`

Returns an object of accessors (call as functions) plus action methods.

```tsx
import { useConsent } from "@policystack/solid";
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
import { useCategory } from "@policystack/solid";

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
import { ConsentGate } from "@policystack/solid";

<ConsentGate requires="analytics" fallback={<EnablePrompt />}>
  <Chart />
</ConsentGate>

<ConsentGate requires={{ and: ["analytics", "marketing"] }}>
  <PersonalizedPromo />
</ConsentGate>
```

## SolidStart (SSR)

`<PolicyStackConsentProvider>` works in SolidStart — call it from your `app.tsx` root:

```tsx
// src/app.tsx
import { PolicyStackConsentProvider } from "@policystack/solid";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { categories } from "./cookies";

export default function App() {
	return (
		<PolicyStackConsentProvider config={{ categories }}>
			<Router>
				<FileRoutes />
			</Router>
		</PolicyStackConsentProvider>
	);
}
```

Pass a pre-built store via `<PolicyStackConsentProvider store={store}>` if you need SSR-time hydration of decisions from cookies.

## Bundling

This package ships source via the `solid` export condition, so consumers using `vite-plugin-solid` (Vite, SolidStart, Astro) will compile the components in their own pipeline.

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating (`gateScript`), and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the Solid adapter is a thin reactivity wrapper. A working example is in [`examples/solid`](../../examples/solid/).

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — React, Vue, Svelte

## License

Apache-2.0
