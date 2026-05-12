---
"@openpolicy/sdk": patch
---

Add `@openpolicy/sdk/opencookies` subpath export with `toOpenCookiesConfig(policy, options?)` — translates `policy.cookies.used` into an `OpenCookiesConfig` so consumers no longer have to hand-roll the `categories` array next to their banner (essential is automatically locked, labels are capitalized). The bridge uses a type-only import from `@opencookies/core`, which is declared as an optional `peerDependency`: users who don't render a banner pay nothing.
