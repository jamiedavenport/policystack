---
"@openpolicy/sdk": patch
"@openpolicy/core": patch
---

Add stable per-document versions to `OpenPolicyConfig`. `defineConfig()` now hashes the resolved config and exposes `privacyVersion` and `cookieVersion` (8-char FNV-1a hex) on the returned object. Each version covers only the slice that feeds the corresponding document, so a privacy-only edit (e.g. `automatedDecisionMaking`) no longer invalidates the cookie banner and vice versa. Both fields are also writable on input for callers who want to pin a manual override (e.g. `"v3"`).

`toOpenCookiesConfig(policy)` now defaults `OpenCookiesConfig.policyVersion` from `policy.cookieVersion`, so `triggers.policyVersionChanged` reprompts correct-by-default. Explicit `options.policyVersion` still wins.

The version, when set, is rendered inline with the effective-date sentence in each policy's intro paragraph so customers have a reference printed in the document.

Also exports `computePrivacyVersion(config)` and `computeCookieVersion(config)` from `@openpolicy/core` (and re-exports from `@openpolicy/sdk`) for callers building configs without `defineConfig`.
