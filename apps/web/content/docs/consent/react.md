---
title: "@policystack/react/consent"
description: "React adapter — useConsent, useCategory, ConsentGate"
product: consent
---

React adapter for PolicyStack Consent. Wraps [`@policystack/core/consent`](/docs/consent/core) with `useSyncExternalStore` for concurrent-safe reactivity.

## Install

```sh
bun add @policystack/core/consent @policystack/react/consent
```

Peer dependencies: `react >= 18`.

## Setup

Wrap your app with `<PolicyStackConsentProvider>`:

```tsx
import { PolicyStackConsentProvider } from "@policystack/react/consent";
import type { Category } from "@policystack/core/consent";
import { createRoot } from "react-dom/client";

const categories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
	{ key: "marketing", label: "Marketing" },
];

createRoot(document.getElementById("root")!).render(
	<PolicyStackConsentProvider config={{ categories }}>
		<App />
	</PolicyStackConsentProvider>,
);
```

Pass a pre-created store with `<PolicyStackConsentProvider store={store}>` instead — useful for SSR-time hydration of decisions from cookies.

Already using PolicyStack? Skip the hand-rolled categories array — `toPolicyStackConsentConfig(policy)` from `@policystack/sdk/consent` produces this config from your `policystack.ts` and defaults `policyVersion` from `cookieVersion` so `triggers.policyVersionChanged` reprompts correct-by-default. See [Cookie banner](/docs/policy/cookies/overview).

## API

### `useConsent()`

Returns the current consent state plus action methods. Re-renders the consumer when state changes.

```tsx
import { useConsent } from "@policystack/react/consent";

function Banner() {
	const { route, acceptAll, acceptNecessary, setRoute } = useConsent();
	if (route !== "cookie") return null;

	return (
		<div className="banner">
			<button onClick={acceptNecessary}>Necessary only</button>
			<button onClick={acceptAll}>Accept all</button>
			<button onClick={() => setRoute("preferences")}>Customize</button>
		</div>
	);
}
```

### `useCategory(key)`

Granular per-category access. Returns `{ granted, toggle }`.

```tsx
import { useCategory } from "@policystack/react/consent";

function AnalyticsToggle() {
	const { granted, toggle } = useCategory("analytics");
	return (
		<label>
			<input type="checkbox" checked={granted} onChange={toggle} />
			Analytics
		</label>
	);
}
```

### `<ConsentGate>`

Renders `children` when the expression is satisfied; renders `fallback` otherwise. The component itself emits no DOM wrapper.

```tsx
import { ConsentGate } from "@policystack/react/consent";

<ConsentGate requires="analytics" fallback={<EnablePrompt />}>
	<Chart />
</ConsentGate>;

<ConsentGate requires={{ and: ["analytics", "marketing"] }}>
	<PersonalizedPromo />
</ConsentGate>;
```

The `requires` shape is a `ConsentExpr` from core: a category key, `{ and: [...] }`, `{ or: [...] }`, or `{ not: ... }`.

## Next.js

Mark the provider as a client component and mount it in your root layout:

```tsx
// app/providers.tsx
"use client";
import { PolicyStackConsentProvider } from "@policystack/react/consent";
import type { Category } from "@policystack/core/consent";

const categories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
];

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<PolicyStackConsentProvider config={{ categories }}>{children}</PolicyStackConsentProvider>
	);
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
```

For SSR-resolved decisions, build the store on the server with the cookie/header storage adapter and pass it via `store={store}` instead of `config={config}`.

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating (`gateScript`), and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the React adapter is a thin reactivity wrapper. A working example is in [`examples/react`](../../examples/react/).

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — Vue, Solid, Svelte

## License

Apache-2.0
