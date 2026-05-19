---
title: "@policystack/svelte/policy"
description: "Svelte adapter — PrivacyPolicy, CookiePolicy, snippet overrides"
product: policy
---

Svelte 5 adapter for Policy. Renders your `policystack.ts` config as Svelte components, with every element overridable via snippets.

## Install

```sh
bun add @policystack/svelte @policystack/sdk
```

Peer dependencies: `svelte >= 5` (the policy renderer is runes-based).

## Setup

There is **one** provider, and for Svelte it ships from the same entry as the components: `@policystack/svelte/policy`. Wrap your app with `<PolicyStack>` and pass it your whole `policystack.ts` config — it supplies the policy context (`<PrivacyPolicy>` / `<CookiePolicy>`) and the consent store. (Consent hooks themselves import from `@policystack/svelte/consent`.)

```svelte
<script lang="ts">
	import { PolicyStack } from "@policystack/svelte/policy";
	import policy from "$lib/policystack";
	let { children } = $props();
</script>

<PolicyStack config={policy}>
	{@render children()}
</PolicyStack>
```

You can also skip the provider and pass `config` directly to a component.

## Components

### `<PrivacyPolicy>` / `<CookiePolicy>`

Render the document for the current config. Props:

- `config?` — a `PolicyStackConfig`. Omit it to read the config from the nearest `<PolicyStack>`.
- `style?` — a CSS string, passed through to the `Root` slot.
- One optional **snippet** per slot (`Root`, `Heading`, `Link`, …) — see below.

```svelte
<script lang="ts">
	import { PolicyStack, PrivacyPolicy } from "@policystack/svelte/policy";
	import policy from "$lib/policystack";
</script>

<PolicyStack config={policy}>
	<PrivacyPolicy />
</PolicyStack>
```

The privacy policy is emitted when the config has a `data` block; the cookie policy when it has `cookies`. See [Privacy policy](/docs/policy/policies/privacy) and [Cookie policy](/docs/policy/policies/cookies) for the config side.

## Snippet overrides

Unlike React/Vue (which take a `components` object), the Svelte adapter takes one snippet **prop per slot**. The `PolicyComponents` type maps each canonical slot to a `Snippet`; every slot receives its `node`, and container slots (`Root`, `Section`, `List`, table slots) additionally receive a `children` snippet. Anything you don't override falls back to the default renderer.

```svelte
<script lang="ts">
	import { PrivacyPolicy } from "@policystack/svelte/policy";
	import policy from "$lib/policystack";
</script>

{#snippet Heading({ node })}
	<svelte:element this={node.level && node.level >= 3 ? "h3" : "h2"} class="font-medium">
		{node.value}
	</svelte:element>
{/snippet}

{#snippet Link({ node })}
	<a href={node.href} class="underline">{node.value}</a>
{/snippet}

<PrivacyPolicy config={policy} {Heading} {Link} />
```

To wrap rather than replace the document shell, override `Root` and render its `children` snippet inside your own markup. The `Default*` slot components are exported too.

## See also

- [Quick Start](/docs/policy/policies/quick-start) — add policy pages to your app
- [Configuration](/docs/policy/configuration) — the `policystack.ts` reference
- [`@policystack/react/policy`](/docs/policy/react) · [`@policystack/vue/policy`](/docs/policy/vue) — other adapters
- [Consent docs](/docs/consent) — the same config also drives the cookie banner

## License

Apache-2.0
