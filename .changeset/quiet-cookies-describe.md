---
"@policystack/core": minor
---

Cookie context entries now accept `label`, `description`, and `respectGPC`, and derived consent categories use that metadata directly. Missing copy falls back to the built-in cookie-type dictionary for the policy locale, so preference panels can render `useConsent().categories` without maintaining a separate copy table (#160).
