---
"@policystack/core": patch
---

Fix `TypeError: process.cwd is not a function` in the browser: remove the host
`package.json` auto-seed of `company.{name,url,contact.email}`. `defineConfig()`
/ `normalizePolicyStackConfig()` is now pure and browser-safe. Set
`company.name`, `company.url`, and `company.contact.email` explicitly in your
PolicyStack config; `validate()` reports any that are missing.
