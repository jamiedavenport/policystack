---
title: "@policystack/vue/consent"
description: "Vue 3 adapter — plugin or provider with composables and ConsentGate"
product: consent
---

Vue 3 adapter for PolicyStack Consent. Bridges [`@policystack/core/consent`](/docs/consent/core) with Vue's reactivity via `shallowRef` and `computed`.

## Install

```sh
bun add @policystack/core/consent @policystack/vue/consent
```

Peer dependencies: `vue >= 3.4`.

## Setup

Register the plugin once on your app:

```ts
import { createApp } from "vue";
import { PolicyStackConsentPlugin } from "@policystack/vue/consent";
import App from "./App.vue";

createApp(App)
	.use(PolicyStackConsentPlugin, {
		config: {
			categories: [
				{ key: "essential", label: "Essential", locked: true },
				{ key: "analytics", label: "Analytics" },
				{ key: "marketing", label: "Marketing" },
			],
		},
	})
	.mount("#app");
```

Or scope a store to a subtree with the `<PolicyStackConsentProvider>` component:

```vue
<script setup lang="ts">
import { PolicyStackConsentProvider } from "@policystack/vue/consent";
</script>

<template>
	<PolicyStackConsentProvider :config="{ categories }">
		<App />
	</PolicyStackConsentProvider>
</template>
```

You can pass a pre-created store to either entry point with `{ store }` instead of `{ config }`.

## API

### `useConsent()`

Returns reactive refs for the current consent state plus action methods. Use it inside `setup()` or any `<script setup>` block.

```vue
<script setup lang="ts">
import { useConsent } from "@policystack/vue/consent";

const { route, decisions, acceptAll, acceptNecessary, setRoute } = useConsent();
</script>

<template>
	<div v-if="route === 'cookie'">
		<button @click="acceptNecessary">Necessary only</button>
		<button @click="acceptAll">Accept all</button>
		<button @click="setRoute('preferences')">Customize</button>
	</div>
</template>
```

### `useCategory(key)`

Granular per-category access. Returns a `granted` computed and a `toggle` action.

```vue
<script setup lang="ts">
import { useCategory } from "@policystack/vue/consent";

const { granted, toggle } = useCategory("analytics");
</script>

<template>
	<label>
		<input type="checkbox" :checked="granted" @change="toggle" />
		Analytics
	</label>
</template>
```

### `<ConsentGate>`

Renders the default slot when an expression is satisfied, optionally a `fallback` slot otherwise. The component itself emits no DOM wrapper.

```vue
<script setup lang="ts">
import { ConsentGate } from "@policystack/vue/consent";
import Chart from "./Chart.vue";
import EnablePrompt from "./EnablePrompt.vue";
</script>

<template>
	<ConsentGate requires="analytics">
		<Chart />
		<template #fallback>
			<EnablePrompt />
		</template>
	</ConsentGate>

	<ConsentGate :requires="{ and: ['analytics', 'marketing'] }">
		<PersonalizedPromo />
	</ConsentGate>
</template>
```

## Options API

The composables are usable from Options API via `setup()`:

```vue
<script lang="ts">
import { defineComponent } from "vue";
import { useConsent, useCategory } from "@policystack/vue/consent";

export default defineComponent({
	setup() {
		const consent = useConsent();
		const analytics = useCategory("analytics");
		return { consent, analytics };
	},
});
</script>

<template>
	<button @click="consent.acceptAll()">Accept all</button>
	<input type="checkbox" :checked="analytics.granted" @change="analytics.toggle()" />
</template>
```

## Nuxt 3

Register the plugin in a Nuxt plugin file:

```ts
// plugins/consent.ts
import { PolicyStackConsentPlugin } from "@policystack/vue/consent";
import type { Category } from "@policystack/core/consent";

const categories: Category[] = [
	{ key: "essential", label: "Essential", locked: true },
	{ key: "analytics", label: "Analytics" },
];

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(PolicyStackConsentPlugin, { config: { categories } });
});
```

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating (`gateScript`), and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the Vue adapter is a thin reactivity wrapper. A working example is in [`examples/vue`](../../examples/vue/).

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — React, Solid, Svelte

## License

Apache-2.0
