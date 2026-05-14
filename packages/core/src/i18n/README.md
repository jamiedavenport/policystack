# i18n

OpenPolicy emits roughly ~125 strings into every compiled privacy/cookie policy. This directory holds the translations.

## How it works

- `types.ts` defines the `Dictionary` contract — a nested object of typed functions, one per string.
- `en.ts` is the ground-truth English dictionary.
- `locales.ts` registers the available locales and exports `isLocale()` for runtime validation.
- `format.ts` exposes `formatDate(date, locale)` for locale-aware date rendering. Use this for any `EffectiveDate` field.
- `index.ts` re-exports `createT(locale)` which returns the bound dictionary for use inside section builders.

Section builders receive a `t: T` argument and access strings via property paths:

```ts
t.privacy.introduction.heading();
t.privacy.introduction.body({ companyName, effectiveDate, versionSuffix });
```

There is no string-key lookup. TypeScript is the lookup — every locale must implement every leaf of `Dictionary`, or `tsc` fails.

## What is NOT translated

- `heading(..., { reason: "Required by GDPR Article 13(1)(c)" })` — `reason` is machine-readable audit metadata threaded into the document tree for compliance tooling, not policy content shown to end users. Stays English.
- Validation messages emitted by `validate.ts`, `validate-config.ts`, and `validate-cookie.ts`. These surface in build logs to the developer integrating OpenPolicy, not in the rendered document. Stays English.
- Section IDs (`"introduction"`, `"data-collected"`, …). These are stable document-tree identifiers used by tests and framework integrations to target sections. Stays English.
- Format-only output from renderers (markdown syntax, HTML tags, PDF bullet glyphs). Already locale-agnostic.
- Internal `Error` messages thrown when configs are malformed (e.g. `"OpenPolicy: data.collected[...] has no matching entry"`). Developer-facing.

## Adding a locale

1. Add the new locale code to the `Locale` union in `packages/core/src/types.ts`.
2. Create `packages/core/src/i18n/<locale>.ts` typed as `Dictionary` — tsc tells you every key that's missing.
3. Register it in `locales.ts` (`LOCALES` array + `dictionaries` table).
4. Add the locale's BCP-47 tag to `LOCALE_TAG` in `format.ts`.
5. Add canary tests that compile a fixture with the new locale and assert distinctly-English phrases are absent in the output.
