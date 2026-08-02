---
"@policystack/core": minor
---

Cookie context entries now accept `label`, `description`, and `respectGPC`, and derived consent categories use that metadata directly. Missing copy falls back to the built-in cookie-type dictionary for the policy locale, so preference panels can render `useConsent().categories` without maintaining a separate copy table (#160).

Note that this changes the default copy for categories that do not set `label`/`description`: a derived category's `label` is now the dictionary label (`"Analytics Cookies"`) rather than the capitalised key (`"Analytics"`), and `description` is now the dictionary description (or `""` for a custom category key) rather than `undefined`. Set `label`/`description` in `cookies.context` to keep your existing wording.
