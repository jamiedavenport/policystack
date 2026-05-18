---
title: Auto-collect
description: Automatically populate data.collected and thirdParties from your source code
product: openpolicy
---

Auto-collect scans your source files at build time and populates the `data.collected` and `thirdParties` fields of your privacy policy automatically — no need to keep those arrays up to date by hand. You still write `data.context` by hand (one entry per category, with `purpose`, `lawfulBasis`, `retention`, and `provision`); for scanned categories, `defineConfig` requires matching entries via a generated `policystack.gen.ts` (written next to your `policystack.ts` and meant to be committed). The same machinery covers cookie categories — scanned `cookies.used` keys must each appear in `cookies.context`.

It works through two complementary mechanisms:

- **`collecting()`** — a zero-cost wrapper you place around data storage calls to declare what you're storing
- **`thirdParty()`** — a side-effect-free call you place next to third-party SDK initialisation to declare an external service

The `@policystack/vite` plugin scans your source files at build time, extracts these declarations, and exposes them to `@policystack/sdk` at runtime so they render inside your policy.

## Install

```sh
bun add -D @policystack/vite
```

## Setup

Add `openPolicy()` to your Vite plugin array. The scan runs during `buildStart` and refreshes on change in dev.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { openPolicy } from "@policystack/vite";

export default defineConfig({
	plugins: [openPolicy()],
});
```

## `collecting()`

Wrap any call that stores personal data with `collecting()`. It returns the second argument unchanged at runtime, so it composes naturally with ORM insert calls and similar patterns.

```ts
import { collecting } from "@policystack/sdk";

export async function createUser(name: string, email: string) {
	return db.insert(users).values(
		collecting(
			"Account Information", // category — appears as a section heading in the policy
			{ name, email }, // value — returned unchanged; matches your ORM schema
			{ name: "Name", email: "Email address" }, // labels — human-readable names used in the policy
		),
	);
}
```

**Arguments:**

| Position | Name       | Description                                                |
| -------- | ---------- | ---------------------------------------------------------- |
| 1        | `category` | Policy section heading (e.g. `"Account Information"`)      |
| 2        | `value`    | The value being stored — returned as-is at runtime         |
| 3        | `labels`   | Object mapping field names to human-readable policy labels |

**Constraints:**

- The `category` string and all label **values** must be string literals. Dynamic values (variables, template literals) are silently skipped by the analyser.
- Every key of `value` must appear in the label record. To exclude a field from the policy — for example an internal column like `hashedPassword` — use the `Ignore` sentinel re-exported from `@policystack/sdk`.
- Multiple `collecting()` calls with the same category are merged; duplicate labels are deduplicated.

### Excluding sensitive fields with `Ignore`

```ts
import { collecting, Ignore } from "@policystack/sdk";

export async function createUser(name: string, email: string, hashedPassword: string) {
	return db.insert(users).values(
		collecting(
			"Account Information",
			{ name, email, hashedPassword },
			{
				name: "Name",
				email: "Email address",
				hashedPassword: Ignore, // excluded from the compiled policy
			},
		),
	);
}
```

Using `Ignore` forces each exclusion to be explicit, so a reviewer can see at a glance which fields are intentionally hidden from the policy.

## `thirdParty()`

Call `thirdParty()` next to third-party SDK initialisation to declare an external service. This is a no-op at runtime.

```ts
import { thirdParty } from "@policystack/sdk";
import { PostHog } from "posthog-js";

thirdParty(
	"PostHog", // service name
	"Product analytics", // purpose — appears in the policy
	"https://posthog.com/privacy", // URL to the service's own privacy policy
);

export const posthog = new PostHog(process.env.POSTHOG_KEY);
```

**Arguments:**

| Position | Name        | Description                                  |
| -------- | ----------- | -------------------------------------------- |
| 1        | `name`      | Service name as it appears in the policy     |
| 2        | `purpose`   | Short description of why you use the service |
| 3        | `policyUrl` | URL to the service's own privacy policy      |

**Constraints:**

- All three arguments must be string literals. Dynamic values are silently skipped.
- If multiple `thirdParty()` calls declare the same `name`, the first one (alphabetically by file path) wins.

## NPM package auto-detection

Instead of writing `thirdParty()` calls manually, you can enable `usePackageJson` to detect known third-party services from your `package.json` dependencies automatically.

```ts
// vite.config.ts
openPolicy({
	thirdParties: {
		usePackageJson: true,
	},
});
```

The plugin reads both `dependencies` and `devDependencies` from your project root `package.json` and matches against a built-in registry of known packages. Explicit `thirdParty()` calls always take precedence — `usePackageJson` only adds entries not already declared in source.

**Known packages:**

| npm package                                                                         | Service          | Purpose                |
| ----------------------------------------------------------------------------------- | ---------------- | ---------------------- |
| `stripe`, `@stripe/stripe-js`                                                       | Stripe           | Payment processing     |
| `braintree`, `@braintree/browser-drop-in`                                           | Braintree        | Payment processing     |
| `@sentry/browser`, `@sentry/node`, `@sentry/nextjs`, `@sentry/react`, `@sentry/vue` | Sentry           | Error tracking         |
| `@datadog/browser-rum`, `dd-trace`                                                  | Datadog          | Monitoring             |
| `posthog-js`, `posthog-node`                                                        | PostHog          | Product analytics      |
| `mixpanel-browser`                                                                  | Mixpanel         | Product analytics      |
| `@segment/analytics-next`                                                           | Segment          | Customer data platform |
| `@amplitude/analytics-browser`, `amplitude-js`                                      | Amplitude        | Product analytics      |
| `@vercel/analytics`                                                                 | Vercel Analytics | Web analytics          |
| `plausible-tracker`                                                                 | Plausible        | Web analytics          |
| `logrocket`                                                                         | LogRocket        | Session recording      |
| `@hotjar/browser`                                                                   | Hotjar           | Session recording      |
| `resend`                                                                            | Resend           | Transactional email    |
| `@sendgrid/mail`                                                                    | SendGrid         | Transactional email    |
| `intercom-client`, `@intercom/messenger-js-sdk`                                     | Intercom         | Customer messaging     |

## Plugin options

```ts
openPolicy({
	srcDir: "src", // directory to scan
	extensions: [".ts", ".tsx"], // file extensions to include
	ignore: ["generated"], // extra directory names to skip
	thirdParties: {
		usePackageJson: true, // detect services from package.json
	},
});
```

| Option                        | Type       | Default           | Description                                                                                                                                                |
| ----------------------------- | ---------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `srcDir`                      | `string`   | `"src"`           | Directory walked for `collecting()` calls, relative to the Vite project root                                                                               |
| `extensions`                  | `string[]` | `[".ts", ".tsx"]` | File extensions scanned                                                                                                                                    |
| `ignore`                      | `string[]` | `[]`              | Extra directory names skipped during the walk (appended to built-in defaults: `node_modules`, `dist`, `.git`, `.next`, `.output`, `.svelte-kit`, `.cache`) |
| `thirdParties.usePackageJson` | `boolean`  | `false`           | Detect third-party services from `package.json` dependencies                                                                                               |
