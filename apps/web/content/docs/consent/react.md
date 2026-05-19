---
title: "@policystack/react/consent"
description: "React adapter — useConsent, useCategory, ConsentGate"
product: consent
---

React adapter for Consent. Wraps [`@policystack/core/consent`](/docs/consent/core) with `useSyncExternalStore` for concurrent-safe reactivity.

## Install

```sh
bun add @policystack/core @policystack/react
```

Peer dependencies: `react >= 18`.

## Setup

There is **one** provider. Wrap your app with `<PolicyStack>` from `@policystack/react/provider` and pass it your whole `policystack.ts` config — it supplies both the policy context (`<PrivacyPolicy>` / `<CookiePolicy>`) and the consent store. The consent categories (and their locked vs. consent-gated state) are derived from `config.cookies`; there is no separate categories array and no conversion step.

```tsx
import { PolicyStack } from "@policystack/react/provider";
import { createRoot } from "react-dom/client";
import config from "./policystack";

createRoot(document.getElementById("root")!).render(
	<PolicyStack config={config}>
		<App />
	</PolicyStack>,
);
```

`useConsent` / `useCategory` / `<ConsentGate>` (from `@policystack/react/consent`) read the store from this same provider. A policy-only config (no `cookies`) creates no store, so a consent hook used under it throws — that is a configuration error, not a runtime state.

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

`<PolicyStack>` is already a client component (`"use client"`). Mount it in your root layout:

```tsx
// app/providers.tsx
"use client";
import { PolicyStack } from "@policystack/react/provider";
import config from "../policystack";

export function Providers({ children }: { children: React.ReactNode }) {
	return <PolicyStack config={config}>{children}</PolicyStack>;
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

For SSR-resolved decisions, author a storage adapter (and jurisdiction resolver) under `config.consent` — the cookie/header adapters from [`@policystack/core/consent`](/docs/consent/core) restore decisions at init. Nothing else changes; the same one config drives it.

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating (`gateScript`), and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the React adapter is a thin reactivity wrapper.

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — Vue, Solid, Svelte

## License

Apache-2.0
