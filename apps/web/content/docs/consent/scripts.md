---
title: "@policystack/scripts"
description: "Pre-built script integrations: GA4, Meta Pixel, PostHog, Segment, GTM, Hotjar"
product: consent
---

Pre-built `defineScript` integrations for the most common third-party vendors. Each integration is a thin factory that returns a `ScriptDefinition` matching the vendor's documented snippet, with sensible defaults for the consent category and pre-consent call queueing — so you can drop them straight into [`gateScript`](/docs/consent/core) without writing the snippet by hand.

Each integration is its own subpath export, so only the ones you import end up in your bundle.

## Install

```sh
npm install @policystack/core @policystack/scripts
```

## Usage

```ts
import { gateScript } from "@policystack/core/consent";
import { metaPixel } from "@policystack/scripts/meta-pixel";

const pixel = metaPixel({ pixelId: "1234567890" });
const dispose = gateScript(store, pixel);
```

The factory returns a plain `ScriptDefinition`. `gateScript` installs a stub at every queued global before consent. When consent is granted it follows the official snippet order: it restores the original globals, runs the vendor's inline bootstrap (`init` — which creates the vendor's own queueing stub), replays the queued calls into it, and only then injects the script, so the vendor drains its own queue on load exactly as it would with the documented snippet. Calling the dispose function while still gated removes the stubs.

Framework adapters expose a renderless `<GatedScript>` that pulls the context store and owns the dispose call. It is available from the React, Vue, Solid, and Svelte `/consent` entry points:

```tsx
import { GatedScript } from "@policystack/react/consent";
import { metaPixel } from "@policystack/scripts/meta-pixel";

<GatedScript def={metaPixel({ pixelId: "1234567890" })} />;
```

See the framework-specific examples for [React](/docs/consent/react#gatedscript), [Vue](/docs/consent/vue#gatedscript), [Solid](/docs/consent/solid#gatedscript), and [Svelte](/docs/consent/svelte#gatedscript). Each wrapper is SSR-inert, preserves queued calls across same-ID rerenders, and accepts an optional `onEvent` callback.

You can also import everything from the package root if tree-shaking the entry barrel is fine for your build:

```ts
import { ga4, metaPixel, posthog } from "@policystack/scripts";
```

## Integrations

Every factory accepts a `requires` (override the default `ConsentExpr`) and `id` (override the default script id) on top of the per-vendor options below.

### Google Analytics 4 — `@policystack/scripts/ga4`

```ts
import { ga4 } from "@policystack/scripts/ga4";

ga4({ measurementId: "G-XXXXXXX", config: { send_page_view: false } });
```

Defaults: `requires: "analytics"`, queues `dataLayer.push` and `gtag`.

### Meta Pixel — `@policystack/scripts/meta-pixel`

```ts
import { metaPixel } from "@policystack/scripts/meta-pixel";

metaPixel({ pixelId: "1234567890" });
```

Defaults: `requires: "marketing"`, queues `fbq`. At consent time — before `fbevents.js` loads — it creates the official snippet's `fbq` stub and fires `fbq("init", pixelId)` and `fbq("track", "PageView")`.

### PostHog — `@policystack/scripts/posthog`

```ts
import { posthog } from "@policystack/scripts/posthog";

posthog({ apiKey: "phc_xxx", apiHost: "https://eu.i.posthog.com" });
```

Defaults: `requires: "analytics"`, `apiHost: "https://us.i.posthog.com"`, queues the common `posthog.*` methods. At consent time — before `array.js` loads — it creates the official snippet's stub and calls `posthog.init(apiKey, { api_host, ...options })`.

### Segment — `@policystack/scripts/segment`

```ts
import { segment } from "@policystack/scripts/segment";

segment({ writeKey: "WRITE_KEY" });
```

Defaults: `requires: "analytics"`, queues the common `analytics.*` methods. At consent time — before `analytics.min.js` loads — it creates the official snippet's queueing array and calls `analytics.page()`.

### Google Tag Manager — `@policystack/scripts/google-tag-manager`

```ts
import { googleTagManager } from "@policystack/scripts/google-tag-manager";

googleTagManager({ containerId: "GTM-XXXXXX" });
```

Defaults: `requires: "marketing"`, queues `dataLayer.push`. Seeds `dataLayer` with `gtm.start` at consent time, before `gtm.js` loads — so consent-mode defaults pushed earlier stay ahead of it.

### Hotjar — `@policystack/scripts/hotjar`

```ts
import { hotjar } from "@policystack/scripts/hotjar";

hotjar({ siteId: 1234567 });
```

Defaults: `requires: "analytics"`, `version: 6`, queues `hj`. At consent time — before the script loads — it creates the official snippet's `hj` stub and sets `_hjSettings`.

## Adding a new integration

PRs welcome. To add a vendor:

1. Add `src/<vendor>.ts` exporting a factory that returns `defineScript({ id, requires, src, queue, init })`. Mirror the vendor's documented snippet — `init` runs **before** the script is injected and must do exactly what the inline bootstrap does: create the vendor's own queueing stub (real vendor scripts like `fbevents.js` decorate that stub and drain its queue, they never create their own global) and make the initial calls. `queue` should list every global a developer might call before consent.
2. Add `src/<vendor>.test.ts` asserting the snippet shape and an end-to-end `gateScript` flow (use the helpers in `src/test-helpers.ts`).
3. Register the entry in `vite.config.ts` and the matching `./<vendor>` subpath in `package.json` `exports`.
4. Add a section to this README with the install snippet and defaults.

## License

Apache-2.0
