---
title: "@policystack/react/policy"
description: "React adapter — PrivacyPolicy, CookiePolicy, custom renderers"
product: policy
---

React adapter for Policy. Renders your `policystack.ts` config as React components — a privacy policy, a cookie policy, or individual sections — with every element overridable.

## Install

```sh
bun add @policystack/react @policystack/sdk
```

Peer dependencies: `react >= 18`.

## Setup

There is **one** provider. Wrap your app with `<PolicyStack>` from `@policystack/react/provider` and pass it your whole `policystack.ts` config — it supplies both the policy context (`<PrivacyPolicy>` / `<CookiePolicy>`) and the consent store. There is no separate config and no conversion step.

```tsx
import { PolicyStack } from "@policystack/react/provider";
import policy from "@/policystack";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return <PolicyStack config={policy}>{children}</PolicyStack>;
}
```

You can also skip the provider and pass `config` directly to a component (handy for a one-off page or React Native).

## Components

### `<PrivacyPolicy>` / `<CookiePolicy>`

Render the document for the current config. Props:

- `config?` — a `PolicyStackConfig`. Omit it to read the config from the nearest `<PolicyStack>` provider.
- `components?` — a `PolicyComponents` map of slot overrides (see below).
- `style?` — passed through to the `Root` slot.

```tsx
import { PolicyStack } from "@policystack/react/provider";
import { PrivacyPolicy, CookiePolicy } from "@policystack/react/policy";
import policy from "@/policystack";

export function PrivacyPolicyPage() {
	return (
		<PolicyStack config={policy}>
			<PrivacyPolicy />
		</PolicyStack>
	);
}
```

The privacy policy is emitted when the config has a `data` block; the cookie policy when it has `cookies`. See [Privacy policy](/docs/policy/policies/privacy) and [Cookie policy](/docs/policy/policies/cookies) for the config side.

## Custom renderers

Components render unstyled by default. Pass a `components` prop to supply your own renderer for any slot — headings, paragraphs, lists, links, tables. The `PolicyComponents` type is the canonical slot contract; every key is optional and falls back to the default renderer.

```tsx
import { PrivacyPolicy, type PolicyComponents } from "@policystack/react/policy";
import policy from "@/policystack";

const components: PolicyComponents = {
	Root: ({ children }) => <div className="space-y-6 text-ink">{children}</div>,
	Heading: ({ node }) =>
		node.level && node.level >= 3 ? (
			<h3 className="text-xl font-medium">{node.value}</h3>
		) : (
			<h2 className="text-2xl font-medium">{node.value}</h2>
		),
	Link: ({ node }) => (
		<a href={node.href} className="underline">
			{node.value}
		</a>
	),
};

export function PrivacyScreen() {
	return <PrivacyPolicy config={policy} components={components} />;
}
```

The default renderers (`DefaultRoot`, `DefaultHeading`, …) and the low-level `renderDocument` helper are exported too, if you want to wrap rather than replace a slot.

## React Native / Expo

`<PrivacyPolicy>` and `<CookiePolicy>` work in React Native when you supply RN equivalents for every slot via `components` — including `Root`, or Metro throws on the default `<div>`. See the worked example in the [Quick Start](/docs/policy/policies/quick-start#react-native--expo).

## See also

- [Quick Start](/docs/policy/policies/quick-start) — add policy pages to your app
- [Configuration](/docs/policy/configuration) — the `policystack.ts` reference
- [`@policystack/vue/policy`](/docs/policy/vue) · [`@policystack/svelte/policy`](/docs/policy/svelte) — other adapters
- [Consent docs](/docs/consent) — the same config also drives the cookie banner

## License

Apache-2.0
