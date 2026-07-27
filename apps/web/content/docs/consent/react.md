---
title: "@policystack/react/consent"
description: "React adapter — useConsent, useCategory, ConsentGate, GatedScript"
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

`toggle` stages the change and `granted` reflects it instantly (it reads the pending `state.draft`), but nothing is applied — `has()`, `<ConsentGate>`, script gating, and storage only change when `save()` promotes the draft. Leaving the preferences route without saving discards it.

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

### `<GatedScript>`

Consent-gates one third-party script for as long as it is mounted. This is the React binding for [`gateScript`](/docs/consent/core#script-gating) and the intended way to use the [`@policystack/scripts`](/docs/consent/scripts) catalogue — it takes the store from `<PolicyStack>`, so you never handle it yourself.

```tsx
import { GatedScript } from "@policystack/react/consent";
import { ga4 } from "@policystack/scripts/ga4";
import { googleTagManager } from "@policystack/scripts/google-tag-manager";

function Analytics() {
	return (
		<>
			<GatedScript def={ga4({ measurementId: "G-XXXXXXX" })} />
			<GatedScript def={googleTagManager({ containerId: "GTM-XXXXXX" })} />
		</>
	);
}
```

The `<script>` tag is injected only once `def.requires` is satisfied. Until then, calls to the globals listed in `def.queue` are captured and replayed after the script loads — so `gtag("event", "signup")` on page boot still reaches GA4 if the visitor accepts a moment later, and never touches the network if they don't.

Renders no DOM, and gates from an effect, so it is inert during SSR. Building the definition inline is fine: the gate follows `def.id`, so a new object each render does not re-gate or lose the queue.

`onEvent` receives the `ScriptEvent` stream (`script:gated`, `script:queued`, `script:loaded`) for debugging or audit logging.

Definitions are not limited to the prebuilt catalogue — `defineScript` from `@policystack/core/consent` takes any vendor snippet:

```tsx
import { defineScript } from "@policystack/core/consent";

const intercom = defineScript({
	id: "intercom",
	requires: { and: ["analytics", "marketing"] },
	src: "https://widget.intercom.io/widget/APP_ID",
	queue: ["Intercom"],
});

<GatedScript def={intercom} />;
```

Core's script-gating semantics carry over unchanged, including [no auto-revoke](/docs/consent/core#no-auto-revoke): a loaded script is never unloaded. Unmounting `<GatedScript>` after consent disposes the gate but leaves the vendor script running, and revoking consent does not re-gate it.

### `useConsentStore()`

Returns the `ConsentStore` from the enclosing `<PolicyStack>`. The hooks above cover the reactive cases and should stay your default; reach for the store only to hand it to a core free function that takes one.

```tsx
import { gateScripts } from "@policystack/core/consent";
import { useConsentStore } from "@policystack/react/consent";
import { useEffect } from "react";

function Tags() {
	const store = useConsentStore();
	useEffect(() => gateScripts(store, [ga4({ measurementId: "G-XXXXXXX" })]), [store]);
	return null;
}
```

The store is stable for the life of the provider and reading it does not subscribe, so this hook never re-renders on state changes. Use `useConsent` (or `store.subscribe`) when you need to react to state. Like the other consent API, it throws under a policy-only config.

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

`useConsent`, `useCategory`, and `ConsentGate` server-render from [`store.server`](/docs/consent/core#server-rendering-storeserver), the deterministic pre-consent snapshot, and switch to live state once hydration commits. Consent-driven UI hydrates cleanly for returning visitors with no `mounted` flag of your own.

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the React adapter is a thin reactivity wrapper. Script gating lives there too, but reach it through `<GatedScript>` above rather than calling `gateScript` yourself.

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — Vue, Solid, Svelte

## License

Apache-2.0
