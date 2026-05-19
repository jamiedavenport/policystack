# ADR 0003 — `@policystack/angular` builds with `ng-packagr` on Angular 21

- **Status:** Accepted
- **Date:** 2026-05-16
- **Ticket:** PS-18 (blocked by PS-16); supersedes [ADR 0002](0002-opencookies-fold-into-core.md) §6
- **Decision drivers:** PS-18 spike; the `vp pack`/`ng-packagr` build-outlier
  question; the TypeScript-version outlier ADR 0002 §6 was avoiding

## Context

PS-18 scoped a spike: build `@policystack/angular` with `vp pack` and, if it
did not build cleanly, **drop Angular from 1.0** — with a hard "no `ng-packagr`
exception" constraint. ADR 0002 §6 had shipped the package as a TypeScript
**src-only stopgap** specifically to avoid an `ng-packagr` / TypeScript-version
outlier.

The spike was reframed: keep the package and find the best way to bundle and
ship it, treating "no `ng-packagr`" as a hypothesis to test rather than a
constraint.

### `vp pack` cannot build an Angular library

`vp pack` is tsdown → Rolldown/oxc: plain TS→JS transpile + bundle. It never
runs the Angular compiler. Angular libraries must be published in **partial-Ivy
/ Angular Package Format (APF)** — declarables need static
`ɵfac`/`ɵprov`/`ɵdir` (`ɵɵngDeclare*`) emitted only by
`@angular/compiler-cli`. `ngcc` was removed in Angular 16+, so a non-Ivy build
is not consumable by any modern Angular AOT app. This package ships a standalone
`@Directive` (`ConsentGate`), `@Injectable`, `@Input`, `effect()`,
`makeEnvironmentProviders` and `InjectionToken`, all of which require Angular
compilation. `vp pack` therefore cannot produce a valid Angular library; a real
build needs the Angular compiler.

### "Is `ng-packagr` that bad?" — No

- It is the **official** tool; the Angular CLI itself uses `ng-packagr`. It
  produces APF (partial-Ivy FESM2022 + flattened `.d.ts`) via the Angular
  compiler + Rollup.
- **Precedent already exists in this monorepo:** `@policystack/svelte` does not
  use `vp pack` — it builds with `@sveltejs/package`. A per-framework packaging
  tool outside `vp pack`, orchestrated fine by `vp run -r build`. `ng-packagr`
  for Angular is the exact analog — consistent, not an exception.
- The real objection in ADR 0002 §6 was the **TypeScript-version outlier**, not
  `ng-packagr` itself — and that was an artifact of pinning **Angular 19**:

  | Angular                | Supported TypeScript                                            | Monorepo `typescript ^5.9.3` |
  | ---------------------- | --------------------------------------------------------------- | ---------------------------- |
  | 19 (old devDep)        | `>=5.5 <5.9`                                                    | ✗                            |
  | 20                     | `5.5 – 5.8`                                                     | ✗                            |
  | **21** (latest stable) | `@angular/compiler-cli` `>=5.9 <6.1`; `ng-packagr` `>=5.9 <6.0` | ✓                            |

  Bumping `@policystack/angular` to **Angular 21** lines the compiler-cli up with
  the monorepo's TS 5.9. There is no version exception.

### Alternatives considered

- **Hand-rolled `ngc --compilationMode partial` + tsdown bundling** —
  reimplements ~70 % of `ng-packagr` (APF/FESM/d.ts flattening) by hand; more
  fragile, no upside. Rejected.
- **AnalogJS `vite-plugin-angular`** — targets app/SSR builds, not APF library
  publishing. Wrong tool. Rejected.
- **Drop Angular from 1.0** — moot now that a clean build exists. The strategic
  keep/drop question is explicitly **deferred**; this ADR records only that the
  build works and the package stays in the fixed changeset group.

## Decision

`@policystack/angular` builds with `ng-packagr` on Angular 21:

- Angular devDeps bumped 19 → 21; added `@angular/compiler-cli`, `ng-packagr`,
  `rxjs`; `zone.js` pinned `~0.15.0` (Angular 21 peer); `peerDependencies`
  raised to `@angular/{core,common} >=20.0.0` (partial-Ivy floor; the consumer's
  linker finalises the format).
- `ng-package.json` (primary entry `src/public-api.ts`) + `tsconfig.lib.json`
  (`compilationMode: "partial"`); `build`/`dev` scripts call `ng-packagr`. The
  existing `tsconfig.json` (`noEmit`) stays for `check-types`/IDE.
- Publish-from-root, `files:["dist"]`, hand-authored root `exports."./consent"`
  → `./dist/types/policystack-angular.d.ts` + `./dist/fesm2022/policystack-angular.mjs`
  — the same convention as `react`/`vue`/`svelte`. ng-packagr's nested
  `dist/package.json` is inert (auto-excluded from the published tarball by
  ng-packagr's `dist/.npmignore`).
- `@policystack/angular` stays in the `.changeset` `fixed` group.

The bare `.` entry remains dropped per ADR 0002 §4 (only `./consent` is
exposed); `ng-packagr` still emits a `.` in its own dist manifest, but the
published root `exports` only surfaces `./consent`.

## Consequences

- The `./package.json` subpath export was removed from this package's `exports`:
  `ng-packagr`'s manifest writer cannot augment a string-valued export entry
  (`"./package.json": "./package.json"`). Minor; revisit if a consumer needs it.
- Build is verified end-to-end: APF/partial-Ivy markers present
  (`ɵɵngDeclareDirective` for `ConsentGate`, `ɵɵngDeclareInjectable`, `ɵfac`/
  `ɵprov`/`ɵdir`); TS 5.9.3 accepted with no compiler-cli conflict; package
  tests pass 11/11 on Angular 21 (happy-dom + zone.js, no source changes); an
  external Angular consumer resolves and type-checks `@policystack/angular/consent`
  against the built `dist`; `npm pack` from root ships a clean FESM + `.d.ts` +
  root `package.json`.
- Node floor rises to Angular 21's engine (`^20.19 || ^22.12 || >=24`); repo
  runs Node 22.22 — satisfied.
- No consumer code changes: only `.changeset/config.json` and ADR 0002
  referenced the package; no examples/apps/SDK import it.
- The keep/drop decision is deferred and rendered moot while the build is green.
