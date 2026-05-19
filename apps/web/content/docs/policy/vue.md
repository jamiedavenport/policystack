---
title: "@policystack/vue/policy"
description: "Vue adapter — PrivacyPolicy, CookiePolicy, custom renderers"
product: policy
---

Vue 3 adapter for Policy. Renders your `policystack.ts` config as Vue components, with every element overridable. The API mirrors the [React adapter](/docs/policy/react), translated to Vue idioms.

## Install

```sh
bun add @policystack/vue @policystack/sdk
```

Peer dependencies: `vue >= 3`.

## Setup

There is **one** provider. Wrap your app with `<PolicyStack>` from `@policystack/vue/provider` and pass it your whole `policystack.ts` config — it supplies both the policy context (`<PrivacyPolicy>` / `<CookiePolicy>`) and the consent store. No separate config, no conversion step.

```vue
<script setup lang="ts">
import { PolicyStack } from "@policystack/vue/provider";
import policy from "@/policystack";
</script>

<template>
	<PolicyStack :config="policy">
		<RouterView />
	</PolicyStack>
</template>
```

You can also skip the provider and pass `:config` directly to a component.

## Components

### `<PrivacyPolicy>` / `<CookiePolicy>`

Render the document for the current config. Props:

- `config?` — a `PolicyStackConfig`. Omit it to read the config from the nearest `<PolicyStack>` provider.
- `components?` — a `PolicyComponents` map of slot overrides (see below).
- `style?` — a Vue `CSSProperties` object, passed through to the `Root` slot.

```vue
<script setup lang="ts">
import { PolicyStack } from "@policystack/vue/provider";
import { PrivacyPolicy } from "@policystack/vue/policy";
import policy from "@/policystack";
</script>

<template>
	<PolicyStack :config="policy">
		<PrivacyPolicy />
	</PolicyStack>
</template>
```

The privacy policy is emitted when the config has a `data` block; the cookie policy when it has `cookies`. See [Privacy policy](/docs/policy/policies/privacy) and [Cookie policy](/docs/policy/policies/cookies) for the config side.

## Custom renderers

Components render unstyled by default. Pass a `components` prop to supply your own renderer for any slot. The `PolicyComponents` type is the canonical slot contract — keys are optional and fall back to the default renderer.

```vue
<script setup lang="ts">
import { h } from "vue";
import { PrivacyPolicy, type PolicyComponents } from "@policystack/vue/policy";
import policy from "@/policystack";

const components: PolicyComponents = {
	Heading: (props) => h("h2", { class: "text-2xl font-medium" }, props.node.value),
	Link: (props) => h("a", { href: props.node.href, class: "underline" }, props.node.value),
};
</script>

<template>
	<PrivacyPolicy :config="policy" :components="components" />
</template>
```

The default renderers (`DefaultRoot`, `DefaultHeading`, …) and the low-level `renderDocument` helper are exported too, if you want to wrap rather than replace a slot.

## See also

- [Quick Start](/docs/policy/policies/quick-start) — add policy pages to your app
- [Configuration](/docs/policy/configuration) — the `policystack.ts` reference
- [`@policystack/react/policy`](/docs/policy/react) · [`@policystack/svelte/policy`](/docs/policy/svelte) — other adapters
- [Consent docs](/docs/consent) — the same config also drives the cookie banner

## License

Apache-2.0
