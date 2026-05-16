# ADR 0002 — OpenCookies folds into `@openpolicy/core`, not a standalone consent package

- **Status:** Accepted
- **Date:** 2026-05-16
- **Ticket:** PS-16 (blocks PS-17, PS-18, PS-19, PS-21, PS-22)
- **Decision drivers:** v1 architecture plan Decisions 2 & 5; PS-14 (jurisdiction
  table); PS-10 (AST freeze)

## Context

Decision 5 of the v1 plan specified the OpenCookies headless core as a
**standalone** `@policystack/consent` package, with per-framework adapters
folded into `@policystack/{react,vue,svelte}` via a `./consent` subpath.

While executing PS-16 the standalone boundary was reconsidered and **reversed**.
The consent runtime depends on `@openpolicy/core`'s `JurisdictionId` /
`JURISDICTION_TABLE` (PS-14) for the forthcoming posture resolver; every package
already shares a single **fixed** changeset version, so co-versioning a second
package adds a skew failure mode for no isolation benefit; and the OpenCookies
core was verified **import-pure** (zero module-level side effects), so absorbing
it does not weaken `@openpolicy/core`'s `sideEffects:false` contract. Subpath
exports plus `sideEffects:false` already give complete bundle separation, which
is the only property a separate package would have bought.

## Decisions

### 1. Consent core → `@openpolicy/core/consent`

OpenCookies `@opencookies/core` is folded into `packages/core/src/consent/**`
and published as the `@openpolicy/core` subpaths `./consent`,
`./consent/storage/cookie`, `./consent/storage/local-storage`,
`./consent/storage/server`. The compiler stays at the bare `.` entry.

### 2. No barrel between compile and consent — _enforced_

`src/index.ts` (compiler) and `src/consent/index.ts` (runtime) are independent
`vp pack` entries; neither imports the other. Verified: `dist/index.js` has zero
consent symbols and `dist/consent/index.js` has zero compiler symbols. This is
what makes the policy side tree-shake the consent runtime out entirely.

### 3. Scope stays `@openpolicy/*`

Consent lands as `@openpolicy/*`, consistent with the eight existing packages
and the fixed changeset group. The global `@policystack/*` rename remains a
single, separate breaking event — one variable changes at a time.

### 4. Framework split — `./policy` + `./consent`, bare `.` dropped (breaking)

`@openpolicy/{react,vue,svelte}` expose `./policy` (renderers) and `./consent`
(banner adapter) as independent entries; the bare `.` export is removed.
`@openpolicy/{solid,angular}` are new consent-only packages exposing `./consent`;
`@openpolicy/scripts` is the standalone vendor-tag-loader package. Core keeps a
bare `.` (deliberate asymmetry — it is the frozen, internally-bundled incumbent;
a separate `./consent` entry already isolates the runtime).

### 5. Consent surface is the **unstable** region of an otherwise-frozen core

The `Node`/`visit()` compiler surface is frozen by ADR 0001. The `./consent`
subpath is explicitly **unstable and unpublished** until the policy+consent 1.0
freeze (plan Decision 5). Living inside `@openpolicy/core` does not extend the
freeze to consent: the frozen guarantee is scoped to the `.` entry; `./consent`
may still take breaking changes (PS-21 Category bridge metadata, PS-22
`sharing()`) before 1.0.

### 6. Angular ships src-only (stopgap) — _superseded by [ADR 0003](0003-angular-library-build.md)_

Originally: `@openpolicy/angular` ships TypeScript source (no `ng-packagr`, no
TS 5.6 outlier); real packaging owned by **PS-18**. **Resolved (PS-18):** the
package now builds via `ng-packagr` on Angular 21 into Angular Package Format.
The TypeScript-version outlier the stopgap was avoiding does **not**
materialise — Angular 21's `@angular/compiler-cli` targets TS `>=5.9`, matching
the monorepo's `typescript ^5.9.3`. See [ADR 0003](0003-angular-library-build.md).

## Consequences

- **Breaking (pre-1.0, expected):** every `@openpolicy/{react,vue,svelte}`
  policy import moves from the bare specifier to `…/policy`. Real first-party
  importers updated (`apps/web` `/privacy` route, `examples/tanstack`); doc and
  marketing snippets under `apps/web/content/**` are a separate docs follow-up.
- The SDK bridge moved `@openpolicy/sdk/opencookies` → `@openpolicy/sdk/consent`
  and now type-imports `@openpolicy/core/consent`; the external
  `@opencookies/core` dev/peer dependency is removed. The bridge stays
  `import type`-only so the SDK bundle (which inlines all of core) carries zero
  consent runtime — verified.
- PS-17 shrinks: `@openpolicy/core` is already in the fixed changeset group, so
  only the new `@openpolicy/{solid,scripts}` packages need adding.
- Downstream tickets re-path `@policystack/consent` → `@openpolicy/core/consent`
  (PS-19 scanner fold, PS-21/PS-22 config bridge).
- The OpenCookies scanner + Vite plugin are **not** brought in here (PS-19); the
  empty `scripts` CLI scaffold is dropped; OpenCookies example apps are
  superseded by `apps/web` and existing examples.
- Acceptance: monorepo has the consent packages under the new names; subpath
  tree-shaking verified — **met**.
