---
title: V1 support matrix and limitations
description: Current PolicyStack V1 framework, renderer, CLI, jurisdiction, and server-side coverage. Distinguish shipped APIs from the planned V2 platform.
lastModified: 2026-09-06
---

PolicyStack V1 is a TypeScript-first library for policy generation and headless consent. This matrix describes the 1.5.0 release line and checked-in implementation, reviewed on 6 September 2026. Packaging differences are called out explicitly.

## Which frameworks does PolicyStack support?

| Integration            | Policy rendering | Consent bindings          | GatedScript               |
| ---------------------- | ---------------- | ------------------------- | ------------------------- |
| React 18+              | Yes              | Yes                       | Yes                       |
| Vue 3.5+               | Yes              | Yes, see packaging caveat | Yes, see packaging caveat |
| Svelte 5               | Yes              | Yes, runes and stores     | Yes                       |
| Solid 1.8+             | No               | Yes                       | Yes                       |
| Angular 20+            | No               | Yes                       | No                        |
| Framework-neutral core | Document AST     | Consent store             | gateScript / gateScripts  |

The Vue 1.5.0 published export map omits `@policystack/vue/provider`, although this repository implements it. Direct policy rendering with a `config` prop works; shared-provider examples require a release whose export map includes `./provider`. Do not assume repository source is already published.

Solid 1.5.0 exports TypeScript source, so the consuming toolchain must transpile dependency source. Svelte's store API is available, but the package requires Svelte 5; it is not a Svelte 4 compatibility guarantee.

## Which documents and output formats are supported?

V1 generates **privacy and cookie policies**. The core compiles a renderer-neutral document AST. `@policystack/renderers` exports Markdown, HTML, and PDF; React, Vue, and Svelte provide policy components. Terms of service, DPAs, DPIAs, and data-subject request workflows are not included.

A `data` or `children` declaration triggers privacy emission; `cookies` triggers cookie emission. `trackingTechnologies` alone does not auto-emit a cookie policy. An explicit `policies` selection controls emission. The privacy compiler currently requires non-empty collected data even though the validator permits an empty declaration with a warning.

## Does PolicyStack include a cookie banner?

No finished banner or preferences UI ships with V1. PolicyStack is headless: the application supplies layout, copy, accessibility, and vendor integration. The [React quickstart](/docs/quickstart) demonstrates a minimal UI.

## Does PolicyStack automatically block every cookie?

No. Vite analysis detects some ungated source usage. Runtime enforcement happens only where applications call the consent APIs or use gates. Static scanning is heuristic, cannot prove all data flows are covered, and skips unsupported dynamic declarations. Revoking consent does not undo earlier vendor actions or unload scripts that already ran.

Seven vendor factories ship: GA4, Google Tag Manager, Meta Pixel, PostHog, Segment, Hotjar, and Microsoft Clarity.

## Which CLI and agent tools ship?

`policystack init`, `policystack validate --json`, and `policystack mcp` are implemented. Consent-specific scan and sync shell commands are not implemented. Use the Vite scanner or MCP `scan_ungated` tool instead. The [agent guide](/docs/policy/agent-skills) links the generated SDK reference and four generated workflow skills.

## What jurisdiction and language coverage exists?

Jurisdiction-specific policy text exists for `eea`, `uk`, and `us-ca`. Other supported jurisdiction IDs use generic text and emit `jurisdiction-generic-policy-text`; an accepted ID does not imply complete legal coverage. Consent posture and policy-text coverage are separate. Unknown countries fall back to conservative opt-in behaviour.

Built-in boilerplate supports English, French, German, Dutch, and Spanish. User-supplied purposes, names, and retention statements are not translated. [Jurisdiction reference](/docs/policy/references/jurisdictions).

## Does V1 enforce consent in backend services?

V1 provides cookie/header helpers and a generic HTTP storage adapter. It does not provide server middleware, identity-to-consent mapping, distributed revocation, Python/Go SDKs, or background-job enforcement. Applications must supply those integrations.

## What is planned for V2?

A self-hostable control plane, privacy inventory, backend enforcement, and rights workflows are [planned V2 direction](/docs/roadmap), not shipped V1 capabilities. No availability date or price is committed here.

## Licensing and review

Current V1 packages are Apache-2.0. Proposed V2 licensing is described separately on the roadmap and is subject to review. Generated documents and consent UX require human review; PolicyStack cannot determine your obligations or guarantee compliance.

## Implementation evidence

- [Package manifests and source](https://github.com/jamiedavenport/policystack/tree/main/packages).
- [Emission rules](https://github.com/jamiedavenport/policystack/blob/main/packages/core/src/emit.ts) and [compiler tests](https://github.com/jamiedavenport/policystack/tree/main/packages/core/src).
- [CLI commands](https://github.com/jamiedavenport/policystack/blob/main/packages/cli/src/index.ts) and [MCP tools](https://github.com/jamiedavenport/policystack/blob/main/packages/cli/src/mcp/tools.ts).
