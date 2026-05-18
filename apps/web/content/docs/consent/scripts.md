---
title: "@policystack/scripts"
description: "Pre-built script integrations: GA4, Meta Pixel, PostHog, Segment, GTM, Hotjar"
product: consent
---

Pre-built `defineScript` integrations for the most common third-party vendors. Each integration is a thin factory that returns a `ScriptDefinition` matching the vendor's documented snippet, with sensible defaults for the consent category and pre-consent call queueing — so you can drop them straight into [`gateScript`](/docs/consent/core) without writing the snippet by hand.

Each integration is its own subpath export, so only the ones you import end up in your bundle.

## Install

```sh
npm install @policystack/core/consent @policystack/scripts
```

## Usage

```ts
import { gateScript } from "@policystack/core/consent";
import { metaPixel } from "@policystack/scripts/meta-pixel";

const pixel = metaPixel({ pixelId: "1234567890" });
const dispose = gateScript(store, pixel);
```

The factory returns a plain `ScriptDefinition`. `gateScript` installs a stub at every queued global before consent, replays the calls into the real client once the script loads, and removes itself when you call the dispose function.

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

Defaults: `requires: "marketing"`, queues `fbq`. Fires `fbq("init", pixelId)` and `fbq("track", "PageView")` on load.

### PostHog — `@policystack/scripts/posthog`

```ts
import { posthog } from "@policystack/scripts/posthog";

posthog({ apiKey: "phc_xxx", apiHost: "https://eu.i.posthog.com" });
```

Defaults: `requires: "analytics"`, `apiHost: "https://us.i.posthog.com"`, queues the common `posthog.*` methods. Calls `posthog.init(apiKey, { api_host, ...options })` on load.

### Segment — `@policystack/scripts/segment`

```ts
import { segment } from "@policystack/scripts/segment";

segment({ writeKey: "WRITE_KEY" });
```

Defaults: `requires: "analytics"`, queues the common `analytics.*` methods. Calls `analytics.page()` on load.

### Google Tag Manager — `@policystack/scripts/google-tag-manager`

```ts
import { googleTagManager } from "@policystack/scripts/google-tag-manager";

googleTagManager({ containerId: "GTM-XXXXXX" });
```

Defaults: `requires: "marketing"`, queues `dataLayer.push`. Seeds `dataLayer` with `gtm.start` on load.

### Hotjar — `@policystack/scripts/hotjar`

```ts
import { hotjar } from "@policystack/scripts/hotjar";

hotjar({ siteId: 1234567 });
```

Defaults: `requires: "analytics"`, `version: 6`, queues `hj`. Sets `_hjSettings` on load.

## Adding a new integration

PRs welcome. To add a vendor:

1. Add `src/<vendor>.ts` exporting a factory that returns `defineScript({ id, requires, src, queue, init })`. Mirror the vendor's documented snippet — `init` should match what their inline bootstrap does, and `queue` should list every global a developer might call before consent.
2. Add `src/<vendor>.test.ts` asserting the snippet shape and an end-to-end `gateScript` flow (use the helpers in `src/test-helpers.ts`).
3. Register the entry in `vite.config.ts` and the matching `./<vendor>` subpath in `package.json` `exports`.
4. Add a section to this README with the install snippet and defaults.

## License

Apache-2.0
