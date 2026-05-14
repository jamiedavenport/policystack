---
"@openpolicy/core": patch
---

Extract every English string emitted by the compiler into a locale dictionary at `packages/core/src/i18n/`. Adds an optional `locale?: Locale` field to `OpenPolicyConfig` (defaults to `"en"`); section builders now consume a typed `t: T` dictionary instead of inline literals.

This is a pure refactor — no behaviour change for existing configs. The `Locale` type is currently a single-member union (`"en"`); additional locales (starting with French) will follow in subsequent releases.

Internal note: `PrivacyPolicyConfig` and `CookiePolicyConfig` (the internal types produced by `expandOpenPolicyConfig`) now require a `locale: Locale` field. End-users who only call `defineConfig()` are unaffected. Anyone constructing those internal shapes by hand needs to add `locale: "en"`.

`locale` is included in the inputs to `computePrivacyVersion` and `computeCookieVersion` so future multi-locale builds of the same config produce distinct version hashes. Configs that don't set `locale` produce the same hash as before.
