# @openpolicy/cli

## 0.0.34

## 0.0.33

## 0.0.32

## 0.0.31

## 0.0.30

### Patch Changes

- 1d0ca66: Add `@openpolicy/svelte` — native Svelte 5 components for rendering OpenPolicy privacy and cookie policies.

  ```svelte
  <script lang="ts">
  import { OpenPolicy, PrivacyPolicy } from "@openpolicy/svelte";
  import config from "../openpolicy";
  </script>

  <OpenPolicy {config}>
    <PrivacyPolicy />
  </OpenPolicy>
  ```

  The package mirrors the React and Vue integrations: `<OpenPolicy>` provides config via context, `<PrivacyPolicy>` and `<CookiePolicy>` render the compiled document, and any default renderer can be replaced by passing a snippet prop (`heading`, `paragraph`, `list`, `table`, etc.). Works with SvelteKit SSR.

  The CLI also detects `svelte` in `package.json` and installs `@openpolicy/svelte` automatically during `openpolicy init`.

## 0.0.29

### Patch Changes

- 9960678: **Breaking:** `company.contact` is now an object with `email` (required) and an optional `phone` field, replacing the previous email-only string.

  ```diff
   company: {
     name: "Acme",
     legalName: "Acme Inc.",
     address: "123 Main St",
  -  contact: "privacy@acme.com",
  +  contact: { email: "privacy@acme.com", phone: "+1-800-555-0100" },
   },
  ```

  CCPA §1798.130(a)(1) requires businesses to provide two or more designated methods for consumers to submit privacy requests, and (unless you operate exclusively online) one must be a toll-free phone number. Setting `company.contact.phone` is now disclosed in:

  - The privacy policy **Contact** section (alongside email).
  - A new **Submitting requests** subsection inside the CCPA supplement that lists the available submission methods.
  - The cookie policy **Contact Us** section.

  A new validation warning (`company-contact-phone-recommended`) fires when `jurisdictions` includes `us-ca` and `phone` is unset. It's a warning, not an error — businesses operating exclusively online may omit it.

  A new `Contact` type is exported from `@openpolicy/sdk` and `@openpolicy/core`.

- 9960678: **Breaking:** consolidate per-category metadata into `data.context` and `cookies.context`.

  `data.purposes`, `data.lawfulBasis`, `data.retention`, and `data.provisionRequirement` are replaced by a single `data.context` map keyed by category. Each entry carries `purpose`, `lawfulBasis`, `retention`, and `provision`. The same applies to cookies: `cookies.lawfulBasis` becomes `cookies.context[key].lawfulBasis`.

  New `provision` helpers — `Statutory()`, `Contractual()`, `ContractPrerequisite()`, `Voluntary()` — replace the verbose `{ basis, consequences }` literal.

  Migration:

  ```diff
   data: {
     collected: { "Account Information": ["Name", "Email"] },
  -  purposes: { "Account Information": "To create accounts" },
  -  lawfulBasis: { "Account Information": LegalBases.Contract },
  -  retention: { "Account Information": "Until account deletion" },
  -  provisionRequirement: {
  -    "Account Information": { basis: "contract-prerequisite", consequences: "We cannot create your account." },
  -  },
  +  context: {
  +    "Account Information": {
  +      purpose: "To create accounts",
  +      lawfulBasis: LegalBases.Contract,
  +      retention: "Until account deletion",
  +      provision: ContractPrerequisite("We cannot create your account."),
  +    },
  +  },
   },
   cookies: {
     used: { essential: true, analytics: true },
  -  lawfulBasis: {
  -    essential: LegalBases.LegalObligation,
  -    analytics: LegalBases.Consent,
  -  },
  +  context: {
  +    essential: { lawfulBasis: LegalBases.LegalObligation },
  +    analytics: { lawfulBasis: LegalBases.Consent },
  +  },
   },
  ```

  Each category name is now typed twice (once in `collected`, once in `context`) instead of five times. The Vite auto-collect plugin is unchanged: scanned categories must still appear in `data.context` / `cookies.context`, enforced via `ScannedCollectionKeys` / `ScannedCookieKeys` in `openpolicy.gen.ts`.

- 9960678: **Breaking:** the cookie banner, preferences panel, and consent runtime have moved to a sibling project, **OpenCookies** (https://github.com/jamiedavenport/opencookies).

  OpenPolicy still generates the cookie _policy_ (the legal document) — `<CookiePolicy>`, `defineCookie()`, and the `cookies.used` / `cookies.context` config keys are unchanged. Only the consent UI/runtime has been extracted.

  Removed from `@openpolicy/react`:

  - `useCookies()` hook
  - `<ConsentGate>` component
  - `useShouldShowCookieBanner()` hook
  - The consent-tracking responsibilities of `<OpenPolicy>` — the provider is now a thin config-only context (mirrors `@openpolicy/vue`). Continue mounting `<OpenPolicy config={...}>` so `<PrivacyPolicy>` / `<CookiePolicy>` can read the config.

  Removed from `@openpolicy/core`:

  - `acceptAll()` / `rejectAll()` helpers
  - `CookieConsent` and `CookieConsentStatus` types

  The `ConsentMechanism` type and `consentMechanism` policy field are unchanged — they are informational policy content, not runtime.

  Removed from `@openpolicy/vite`:

  - The auto-collect scanner no longer recognises `<ConsentGate>` or `useCookies().has()` from `@openpolicy/react`. Declare cookie categories with `defineCookie()` instead. (When OpenCookies publishes its own Vite plugin, scanning targeted at its components can be reintroduced.)

  Migration: install OpenCookies for banner/preferences/consent, keep using OpenPolicy for the cookie policy document.

- 9960678: The `openPolicy()` Vite plugin now runs the validators from `@openpolicy/core` against your resolved `openpolicy.ts` on every build. Errors that previously only fired when you called `validateOpenPolicyConfig()` manually (missing `effectiveDate`, GDPR lawful basis incomplete, retention missing, etc.) now surface inline:

  - `vite build` aborts with a non-zero exit code listing `[openpolicy] code: message` for each error. Warnings (CCPA phone, DPO disclosure, etc.) print via Rollup's warning channel without blocking.
  - `vite dev` streams both errors and warnings to the dev-server logger. HMR keeps working — fix the issues and the next save replays validation.

  Validation runs against the _resolved_ config — auto-collected `collecting()` / `defineCookie()` data is shimmed in via the same path the consumer's bundle uses, so a scanned category without a matching `data.context` entry now fails validation at build time, not just at type-check.

  If you want the auto-collect virtual module without the validation step, opt out:

  ```ts
  // vite.config.ts
  openPolicy({ validate: false });
  ```

  Internally this adds `bundle-require` (the same primitive Vite uses for `vite.config.ts`) and `@openpolicy/core` as runtime dependencies of `@openpolicy/vite`.

## 0.0.28

### Patch Changes

- 5e0ea9d: **Breaking:** unify lawful basis and retention with their data categories under one symmetric shape; reshape cookies the same way.

  `OpenPolicyConfig.legalBasis` and `OpenPolicyConfig.retention` are removed from the top level. They now live inside `data` and are keyed by the same set as `data.collected`, so missing or mismatched keys become a TS error at the `defineConfig` call site (with a runtime validator backstop). `data.lawfulBasis` and `data.retention` are required when `data` is present.

  `CookiePolicyCookies` is reshaped from a flat `{ essential: true; [k]: boolean }` map into `{ used: { essential: true; [k]: boolean }; lawfulBasis: { [k]: LegalBasis } }`. Every enabled cookie category requires an Article 6 lawful basis; the rendered "Cookies and Tracking" section appends the basis label to each enabled bullet.

  The Vite plugin now also emits a `ScannedCookieKeys` interface augmentation alongside `ScannedCollectionKeys` in `openpolicy.gen.ts`, threading scanned cookie categories through the `defineConfig` generic the same way data categories already are.

  **Migration:**

  ```diff
   export default defineConfig({
     data: {
       collected: { "Account Information": ["Email"] },
       purposes: { "Account Information": "Auth" },
  +    lawfulBasis: { "Account Information": LegalBases.Contract },
  +    retention: { "Account Information": "Until account deletion" },
     },
  -  legalBasis: { "Providing the service": LegalBases.Contract },
  -  retention: { "Account data": "Until account deletion" },
     cookies: {
  -    essential: true,
  -    analytics: false,
  +    used: { essential: true, analytics: false },
  +    lawfulBasis: { essential: LegalBases.LegalObligation, analytics: LegalBases.Consent },
     },
   });
  ```

## 0.0.27

### Patch Changes

- 261bae3: **Breaking:** top-level `dataCollected` moves to `data.collected`, and a sibling `data.purposes` is newly required — one prose string per collected category, disclosing _why_ you process it. Satisfies GDPR Article 13(1)(c), which was previously unaddressed.

  `defineConfig` now enforces purpose coverage at type-check time: every key in `data.collected` must have a matching entry in `data.purposes`. The `openPolicy()` Vite plugin emits `openpolicy.gen.ts` next to your `openpolicy.ts`, augmenting a `ScannedCollectionKeys` interface so the same constraint applies to scanned `collecting()` categories. Commit `openpolicy.gen.ts` — that keeps the type-level constraint live in CI without needing to run the Vite plugin first.

  Migration: nest `dataCollected` under `data.collected`, then add a `data.purposes` map keyed by the same category names.

  ```ts
  // before
  defineConfig({
    dataCollected: { "Account Information": ["Name", "Email"] },
  });

  // after
  defineConfig({
    data: {
      collected: { "Account Information": ["Name", "Email"] },
      purposes: {
        "Account Information":
          "To authenticate users and send service notifications",
      },
    },
  });
  ```

- 261bae3: **Breaking:** `compile()` now throws when `dataCollected` is empty. Previously, an
  empty `dataCollected` produced an "Information We Collect" section with the
  intro sentence "We collect the following categories of information:" followed
  by an empty list, which fails GDPR's categories-of-data disclosure
  requirement. To fix, populate `dataCollected` in your config, or instrument
  `collecting()` calls and use `autoCollect()` from `@openpolicy/vite-auto-collect`.

## 0.0.26

### Patch Changes

- 21b6670: OpenPolicy is now licensed under Apache-2.0 (previously GPL-3.0-only).
  The `LICENSE.md` file and the `license` field in every published package
  manifest have been updated, and each published tarball now ships
  `LICENSE.md` and `NOTICE.md` at its root. No code changes accompany
  this relicense.

## 0.0.25

### Patch Changes

- a38360e: Bundle `citty` and `consola` into the CLI's `dist/cli.js` and drop them from runtime `dependencies`. The published tarball now ships a single self-contained binary, so installing `@openpolicy/cli` no longer pulls in a dep tree (~470K → one ~126K file) and consumers can't end up on a mismatched dependency version.
- a38360e: Fix broken `openpolicy` bin in the published package. The CLI's `bin` entry was relying on `publishConfig.bin` to override a dev-only `./src/cli.ts` path to `./dist/cli.js` at publish time, but the override wasn't applied — so the published tarball shipped a bin pointing at a TypeScript source file with no shebang, and invoking `openpolicy` fell through to bash and exited 1. `bin` now points directly at `./dist/cli.js`.

## 0.0.24

### Patch Changes

- 94b16b7: **Breaking:** the CLI is now an install + prompt tool only.

  - `openpolicy generate` and `openpolicy validate` are removed. Use `@openpolicy/vite` to collect data at build time and `@openpolicy/react` / `@openpolicy/vue` to render policies at runtime.
  - `openpolicy init` now detects your package manager (bun/pnpm/yarn/npm) and the frameworks in your `package.json` (vite / react / vue), installs `@openpolicy/sdk` plus the matching integrations, writes a minimal `openpolicy.ts` stub (preferring `src/openpolicy.ts` when a `src/` directory exists), and prints a prompt you can paste into a coding agent (Claude Code, Cursor, etc.) to complete setup.
  - New flags: `--cwd`, `--pm`, `--skip-install`, `--dry-run`, `--yes`, `--out`, `--force`.
  - `@openpolicy/core` and `@openpolicy/renderers` are no longer devDependencies of the CLI.

- 94b16b7: Canonical jurisdiction scheme + UK-GDPR support (OP-209, OP-181).

  **Breaking:** `Jurisdiction` values have been replaced with a canonical region-code scheme. Unknown codes are now rejected by the config validator at compile time.

  Old union: `"us" | "eu" | "ca" | "au" | "nz" | "other"`
  New union: `"eu" | "uk" | "us-ca" | "us-va" | "us-co" | "br" | "ca" | "au" | "jp" | "sg"`

  - `"us"` is **removed** — there is no federal US privacy regime shipping content. List specific state codes (e.g. `"us-ca"`) for the states you cover.
  - `"ca"` **semantics flipped** from California → Canada. Consumers using `"ca"` for CCPA must migrate to `"us-ca"`. `"ca"` is now a reserved code for Canada and produces no gated content yet.
  - `"nz"` and `"other"` are removed.
  - New `"uk"` code triggers a UK-GDPR supplement citing the ICO and the Data Protection Act 2018 (closes OP-181).
  - Reserved codes `"us-va"`, `"us-co"`, `"br"`, `"ca"`, `"au"`, `"jp"`, `"sg"` are type-valid today but produce no gated content in 0.1.0.
  - `Compliance.CCPA` preset now expands to `{ jurisdictions: ["us-ca"] }`. New `Compliance.UK_GDPR` preset provides `{ jurisdictions: ["uk"], legalBasis: ["legitimate_interests"] }`.
  - Runtime validator rejects unknown jurisdiction codes with a helpful error listing the full valid set.

  Migration: search your `openpolicy.ts` for `jurisdictions: [...]` and replace `"us"` with the specific state(s) you cover, and `"ca"` (if meant as California) with `"us-ca"`. UK-regulated businesses should add `"uk"`.

## 0.0.23

### Patch Changes

- 8e219fe: Flatten `defineConfig()` — all policy fields now live at the top level. The nested `privacy: { ... }` and `cookie: { ... }` blocks are gone, and `effectiveDate` / `jurisdictions` are single top-level fields (previously duplicated in each block).

  Which policy types are generated is now auto-detected from field presence:

  - **Privacy policy** is emitted if any of `dataCollected`, `legalBasis`, `retention`, `userRights`, or `children` is set.
  - **Cookie policy** is emitted if `cookies` is set.

  You can override auto-detection with `policies: ["privacy"]` or `policies: ["cookie"]`.

  **Breaking changes:**

  - `OpenPolicyConfig` is a single flat object. The `privacy` and `cookie` wrapper keys are removed.
  - `EffectiveDate` is now the template literal type `` `${number}-${number}-${number}` ``.
  - `LegalBasis` is narrowed to a union of GDPR Art. 6 lawful bases: `"consent" | "contract" | "legal_obligation" | "vital_interests" | "public_task" | "legitimate_interests"`. Free-form strings are no longer accepted.
  - `PrivacyPolicyConfig` and `CookiePolicyConfig` are now internal types and no longer re-exported from `@openpolicy/sdk`. Use `OpenPolicyConfig` in user code.
  - `@openpolicy/sdk` re-exports `Retention` (value helper) and the `Retention` type now collides — the type is re-exported as `RetentionMap`.

  **Migration — before:**

  ```ts
  export default defineConfig({
    company: {
      /* … */
    },
    privacy: {
      effectiveDate: "2026-01-01",
      jurisdictions: ["us"],
      dataCollected: {
        /* … */
      },
      legalBasis: "legitimate_interests",
      retention: {
        /* … */
      },
      cookies: { essential: true, analytics: false, marketing: false },
      thirdParties: [],
      userRights: ["access"],
    },
    cookie: {
      effectiveDate: "2026-01-01",
      jurisdictions: ["us"],
      cookies: { essential: true, analytics: true },
    },
  });
  ```

  **After:**

  ```ts
  export default defineConfig({
    company: {
      /* … */
    },
    effectiveDate: "2026-01-01",
    jurisdictions: ["us"],
    dataCollected: {
      /* … */
    },
    legalBasis: "legitimate_interests",
    retention: {
      /* … */
    },
    userRights: ["access"],
    thirdParties: [],
    cookies: { essential: true, analytics: true },
  });
  ```

- 8e219fe: Remove Terms of Service support. OpenPolicy now focuses exclusively on privacy and cookie policies — domains that are globally regulated and have consistent compliance requirements.

  **Breaking changes:**

  - `PolicyInput` is now a discriminated union of `privacy | cookie` only (the `terms` branch has been removed)
  - `TermsOfServiceConfig` and `DisputeResolutionMethod` types have been removed from `@openpolicy/sdk` and `@openpolicy/core`
  - `validateTermsOfService` has been removed from `@openpolicy/core`
  - `<TermsOfService />` components have been removed from `@openpolicy/react` and `@openpolicy/vue`
  - CLI `openpolicy init` no longer offers a `terms` template option; filename auto-detection no longer treats `"terms"` as a policy type
  - The `terms-of-service` shadcn registry item has been removed

  **Migration:** remove the `terms: { ... }` block from your `openpolicy.ts` config and stop importing `<TermsOfService />`. If you need terms of service content, source it from a dedicated legal tool.

- 8e219fe: **Breaking change:** `userRights` has been removed from `OpenPolicyConfig`. The data-subject rights listed in your privacy policy are now derived automatically from `jurisdictions`:

  - `jurisdictions: ["eu"]` → access, rectification, erasure, portability, restriction, objection (GDPR)
  - `jurisdictions: ["ca"]` → access, erasure, opt_out_sale, non_discrimination (CCPA)
  - Both → the union, in a fixed canonical order
  - `us`, `au`, `nz`, `other` → no rights listed (the "Your Rights" section is omitted)

  **Migration:** delete the `userRights` line from your `openpolicy.ts`. TypeScript will flag the field as an excess property; no other changes are needed.

  ```diff
    export default defineConfig({
      company: { /* ... */ },
      effectiveDate: "2026-01-01",
      jurisdictions: ["us", "eu"],
      dataCollected: { /* ... */ },
      legalBasis: ["legitimate_interests", "consent"],
      retention: { /* ... */ },
      thirdParties: [],
  -   userRights: ["access", "erasure"],
    });
  ```

  The rendered privacy policy may list **more** rights than before if your previous `userRights` value was shorter than the baseline required by your declared `jurisdictions` — this is intentional; the refactor closes a footgun where the field under-declared legal obligations.

  Related SDK surface changes:

  - `Rights` constant removed from `@openpolicy/sdk` (superseded by derivation).
  - `UserRight` type re-export removed from `@openpolicy/sdk`.
  - `Compliance.GDPR` and `Compliance.CCPA` no longer include a `userRights` field — they still provide `jurisdictions` (and `legalBasis` for GDPR), which is enough to drive the correct rights list.
  - New `deriveUserRights(jurisdictions)` export in `@openpolicy/core` for consumers (e.g. forthcoming DSAR tooling) that need the same mapping.

## 0.0.22

## 1.0.0

## 0.0.21

## 0.0.20

## 0.0.19

## 0.0.18

## 0.0.17

## 0.0.16

## 0.0.15

### Patch Changes

- 28b6b14: Fixes Jamie's mistakes

## 0.0.13

### Patch Changes

- 2372fdb: - Adds @openpolicy/react library.
  - Adds PDF renderer

## 0.0.12

### Patch Changes

- Unified Config

## 0.0.11

### Patch Changes

- Cookie policy

## 0.0.10

### Patch Changes

- Adds support for multiple input files

## 0.0.9

### Patch Changes

- Fixes bundling and peer deps

## 0.0.8

## 0.0.7

## 0.0.6

### Patch Changes

- Testing

## 0.0.5

### Patch Changes

- HTML Renderer

## 0.0.4

### Patch Changes

- Fixes

## 0.0.3

### Patch Changes

- Fixes

## 0.0.2

### Patch Changes

- Test Release
