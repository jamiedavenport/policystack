---
"@openpolicy/core": patch
"@openpolicy/react": patch
"@openpolicy/vue": patch
"@openpolicy/svelte": patch
---

Add `compilePrivacyPolicy(config)` and `compileCookiePolicy(config)` helpers to `@openpolicy/core` that take an `OpenPolicyConfig` and return `Document | null` directly — eliminating the `expandOpenPolicyConfig(config).find((i) => i.type === ...)` + null-check dance at every call site. The helpers return `null` when the category should not be emitted (e.g. `policies: ["privacy"]` excludes cookie), keeping the "what does missing mean?" decision with the consumer. The React, Vue, and Svelte bindings now use these helpers internally.
