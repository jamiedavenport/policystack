# `@openpolicy/vite`

> Vite plugin that scans source files for [OpenPolicy](https://openpolicy.sh) `collecting()`, `thirdParty()`, `defineCookie()`, and `sharing()` calls and populates the SDK's auto-collected registry at build time.

At `buildStart` the plugin walks your `srcDir`, extracts every `collecting()` / `thirdParty()` / `defineCookie()` / `sharing()` call from `@openpolicy/sdk`, and emits the merged result (`dataCollected` / `thirdParties` / `cookies` / `sharing`) into the on-disk `openpolicy.gen.ts` your config imports. `sharing(key, recipient, value)` marks personal data _leaving_ to a third party at the egress point — the data-flow edge that feeds the CCPA/CPRA sell/share posture, distinct from `thirdParty()` which only declares that a vendor exists.

## Install

```sh
bun add -D @openpolicy/vite
bun add @openpolicy/sdk
# or: npm install --save-dev @openpolicy/vite && npm install @openpolicy/sdk
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { openPolicy } from "@openpolicy/vite";

export default defineConfig({
	plugins: [openPolicy()],
});
```

Astro users: add it the same way under `vite.plugins` in `astro.config.mjs`.

## Options

| Option                        | Type          | Default           | Description                                                                                                                                     |
| ----------------------------- | ------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `srcDir`                      | `string`      | `"src"`           | Directory walked for `collecting()` / `thirdParty()` / `defineCookie()` / `sharing()` calls, relative to the Vite root.                         |
| `extensions`                  | `string[]`    | `[".ts", ".tsx"]` | File extensions to scan.                                                                                                                        |
| `ignore`                      | `string[]`    | `[]`              | Extra directory basenames to skip (appended to the built-in list: `node_modules`, `dist`, `.git`, `.next`, `.output`, `.svelte-kit`, `.cache`). |
| `thirdParties.usePackageJson` | `boolean`     | `false`           | Auto-detect third-party services from `package.json` dependencies against the built-in registry (Stripe, Sentry, PostHog, etc.).                |
| `validate`                    | `boolean`     | `true`            | Validate the resolved `openpolicy.ts` after each scan (see [Validation](#validation)).                                                          |
| `strict`                      | `boolean`     | `false`           | Promote remaining warnings to errors, so they fail `vite build` like real errors.                                                               |
| `suppress`                    | `IssueCode[]` | `[]`              | Issue codes to drop entirely, at any level (errors included). Applied before `strict`.                                                          |

## Validation

When `validate` is `true`, the plugin runs the single `validate()` from
`@openpolicy/core` against your resolved config after every scan and reports
each [`IssueCode`](https://docs.openpolicy.sh) once:

- In **`vite build`**, errors abort the build (`PluginContext.error`); warnings
  are reported (`PluginContext.warn`) but never block.
- In **`vite dev`**, both are logged through the dev-server logger and never
  crash HMR.

`strict` and `suppress` shape the issue list **before** that error/warn split,
in this order:

1. **`suppress`** drops every issue whose `code` is listed, at **any** level —
   errors included. Use it to accept a known disclosure gap; because the list
   lives in `vite.config.ts`, the decision is committed and shows up in review.
   It does **not** silence config load/parse failures.
2. **`strict`** then promotes every remaining warning to an error. A suppressed
   code is gone before this step, so it is never promoted. In `vite build` the
   promoted issues now abort the build; in `vite dev` they log at error level
   but still never crash HMR.

```ts
openPolicy({
	strict: true, // warnings now fail `vite build`
	suppress: ["company-dpo-undeclared"], // …except this one, which we accept
});
```

## Documentation

[openpolicy.sh/docs](https://docs.openpolicy.sh)

## Links

- [GitHub](https://github.com/jamiedavenport/openpolicy)
- [openpolicy.sh](https://openpolicy.sh)
- [npm](https://www.npmjs.com/package/@openpolicy/vite)
