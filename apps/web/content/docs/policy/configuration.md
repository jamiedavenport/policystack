---
title: Configuration
description: Setting up your policystack.ts config file
product: policy
---

All policies are defined in a single config file using `defineConfig()` from `@policystack/sdk`. You can place it anywhere in your project.

## Install

The fastest way is to run [`@policystack/cli`](/docs/policy/cli), which installs `@policystack/sdk` plus the right framework integration for your stack and scaffolds a starter config:

```sh
bunx @policystack/cli init
```

Or install manually:

```sh
bun add @policystack/sdk
```

## Create your config

```ts
// policystack.ts
import { ContractPrerequisite, defineConfig, LegalBases, Voluntary } from "@policystack/sdk";

export default defineConfig({
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea", "us-ca"],
	data: {
		collected: {
			"Account Information": ["Name", "Email address"],
			"Usage Data": ["Pages visited", "IP address"],
		},
		context: {
			"Account Information": {
				purpose: "To authenticate users and send service notifications",
				lawfulBasis: LegalBases.Contract,
				retention: "Until account deletion",
				provision: ContractPrerequisite("We cannot create or operate your account."),
			},
			"Usage Data": {
				purpose: "To understand product usage and improve the service",
				lawfulBasis: LegalBases.LegitimateInterests,
				retention: "90 days",
				provision: Voluntary("None — your service is unaffected."),
			},
		},
	},
	thirdParties: [],
	cookies: {
		used: { essential: true, analytics: false, marketing: false },
		context: {
			essential: { lawfulBasis: LegalBases.LegalObligation },
			analytics: { lawfulBasis: LegalBases.Consent },
			marketing: { lawfulBasis: LegalBases.Consent },
		},
	},
	automatedDecisionMaking: [],
});
```

The `company` block is shared across all policy types. `company.legalName` and `company.address` are required; `company.name`, `company.url`, and `company.contact.email` are seeded from the host `package.json` (`name` / `homepage` / `author.email`) when omitted, and any explicit value wins. All other fields live at the top level: `effectiveDate` and `jurisdictions` are shared, and Policy auto-detects which policies to generate from the fields you provide — include the `data` block for a privacy policy, and the `cookies` block (or `trackingTechnologies`) for a cookie policy.

### Contact methods

`company.contact` is an object: `email` is required, and `phone` is optional. The phone number is rendered alongside the email in the privacy and cookie policy contact sections.

```ts
company: {
  // ...
  contact: {
    email: "privacy@acme.com",
    phone: "+1-800-555-0100", // optional
  },
},
```

Setting `phone` is recommended when `jurisdictions` includes `us-ca`. CCPA §1798.130(a)(1) requires businesses to provide two or more designated methods for consumers to submit privacy requests, and (unless you operate exclusively online) one of those methods must be a toll-free number. When `phone` is set, the rendered CCPA supplement appends a "Submitting requests" block listing both methods. Omitting it under `us-ca` emits a validation warning.

The `data` block has two sibling maps: `collected` (category → field labels) and `context` (category → metadata about that category). `defineConfig`'s generic enforces that every key in `collected` has a matching `context` entry with `purpose`, `lawfulBasis`, `retention`, and `provision`. The `cookies` block mirrors the same shape: `cookies.used` lists the categories you enable (with `essential: true` always required), and `cookies.context` declares the Article 6 basis for each enabled category.

### Data Protection Officer

If you operate under GDPR or UK-GDPR, set `company.dpo` so the policy discloses DPO contact details as required by Article 13(1)(b):

```ts
company: {
  name: "Acme Inc.",
  legalName: "Acme Corporation",
  address: "123 Main St, Springfield, USA",
  contact: { email: "privacy@acme.com" },
  dpo: {
    email: "dpo@acme.com",
    name: "Jane Doe",           // optional
    phone: "+1 555 010 2030",   // optional
    address: "123 Main St...",  // optional
  },
},
```

If appointing a DPO is not required for your processing activities (see GDPR Article 37(1)), say so explicitly — the policy will include the disclosure in the GDPR/UK-GDPR supplements:

```ts
company: {
  // ...
  dpo: { required: false, reason: "Our processing is not large-scale or systematic." },
},
```

Omitting `dpo` emits a validation warning when `jurisdictions` includes `eea` or `uk`.

### Automated decision-making and profiling

GDPR Article 13(2)(f) requires you to disclose whether you use automated decision-making or profiling (Article 22) — even an explicit "we don't" is required. Set `automatedDecisionMaking: []` to declare none, or list each activity with its `name`, `logic`, and `significance`:

```ts
automatedDecisionMaking: [
  {
    name: "Fraud scoring",
    logic: "Transactions are scored by a rules engine combining device fingerprint and historical patterns.",
    significance: "A high score may delay or decline a transaction; you can request human review.",
  },
],
```

Omitting the field entirely emits a validation warning under EU/UK jurisdictions. When at least one activity is listed, the rendered policy automatically appends the Article 22(3) right-to-human-review paragraph referencing `company.contact`.

`data.collected` is a map of category label → fields. `data.context[category]` carries the per-category metadata: `purpose` (prose describing _why_ you process it — GDPR Article 13(1)(c)), `lawfulBasis` (the Article 6 basis), `retention` (how long you keep it), and `provision` (whether providing it is statutory, contractual, a contract-prerequisite, or voluntary, plus the consequences of failing to provide it — GDPR Article 13(2)(e)). The provision helpers `Statutory()`, `Contractual()`, `ContractPrerequisite()`, and `Voluntary()` from `@policystack/sdk` build the right shape from a consequences string. Every key in `data.collected` must appear in `data.context`; `defineConfig` enforces this at type-check time, and the `policyStack()` Vite plugin re-validates it at build time (see [Build-time validation](#build-time-validation)). When auto-collect is enabled, the plugin also emits `policystack.gen.ts` alongside your config (check it in) so the same constraint applies to scanned `collecting()` categories even without running Vite first.

The user rights you're legally required to disclose (access, erasure, portability, etc.) are derived automatically from `jurisdictions` — declare `eea` or `uk` and you get the six GDPR rights, declare `us-ca` and you get the four CCPA rights, declare any combination and you get the union. There's no `userRights` field to set. See [Supported jurisdictions](/docs/policy/references/jurisdictions) for the full list of codes.

### Policy versions

`defineConfig()` hashes the resolved config and exposes `privacyVersion` and `cookieVersion` on the returned object — an 8-character FNV-1a hex string per document. The two hashes are scoped to the slice of the config that feeds each policy, so a privacy-only edit (e.g. adding an entry to `automatedDecisionMaking`) does not invalidate `cookieVersion`, and a cookie-only change does not invalidate `privacyVersion`.

```ts
import policy from "./policy";

policy.privacyVersion; // "a1b2c3d4"
policy.cookieVersion; // "f5e6d7c8"
```

When set, the version is rendered inline with the effective-date sentence in each policy's intro — `… Effective Date: 2026-01-01. Version: a1b2c3d4.` — so customers have a printed reference they can quote.

Pin a manual version (e.g. for a published v3 doc) by passing it on input:

```ts
defineConfig({
	// ...
	privacyVersion: "v3",
});
```

Explicit values always win over the auto-computed hash. Both helpers — `computePrivacyVersion(config)` and `computeCookieVersion(config)` — are also re-exported from `@policystack/sdk` for callers building configs without `defineConfig`.

`cookieVersion` also feeds the Consent bridge — see the [Consent docs](/docs/consent) — so a change to `cookies` (which also drives the derived consent mechanism) re-prompts consent automatically.

### Build-time validation

The `policyStack()` Vite plugin loads your resolved `policystack.ts` and runs every validator in `@policystack/core` against it on each build. It catches issues that TypeScript can't — missing GDPR lawful bases, retention periods, CCPA contact methods, DPO disclosures, and similar requirements that depend on `jurisdictions` rather than on the static shape of the config.

In `vite build`, validation **errors** abort the build with a non-zero exit code and a list of `[policystack] code: message` lines. Warnings are surfaced via Rollup's warning channel and do not block. In `vite dev`, both errors and warnings stream to the dev-server logger and never crash HMR — fix them as you go and the next save replays validation.

Validation runs against the _resolved_ config, with auto-collected data shimmed in first — so a scanned `collecting()` category without a matching `data.context` entry will fail validation just as a hand-written one would.

To opt out (for instance when you want only the type-level guarantees and the auto-collect virtual module):

```ts
// vite.config.ts
policyStack({ validate: false });
```

## Using AI

The fastest way to fill out your config is to hand it to a coding agent. [`@policystack/cli`](/docs/policy/cli) prints a ready-made prompt for this — run `bunx @policystack/cli init`, paste the prompt into Claude Code or Cursor, and the agent will fill in `data`, `thirdParties`, `jurisdictions`, and cookie usage from your codebase. Agents are good at this because the config is typed and the fields map directly to things already described in your dependencies, environment variables, data models, and existing legal copy.
