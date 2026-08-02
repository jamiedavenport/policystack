---
"@policystack/core": minor
"@policystack/vite": minor
---

Storage keys drop the pre-rebrand `oc_` prefix, and the consent scanner now resolves aliased `ConsentGate` imports (#161).

`localStorageAdapter` and `cookieAdapter` both default to `ps_consent` instead of `oc_consent` (and the localStorage probe key is now `__ps_probe__`). **No visitor is re-prompted:** both adapters still read the old key when the new one is absent, so an existing decision keeps loading. The fallback is read-only — writes always go to `ps_consent` — and is skipped entirely when you pass your own `key`/`name`. The one exception is `clear()`, which removes both keys; otherwise the fallback would resurrect a decision the visitor just withdrew.

Two things to check if you touch the cookie name directly:

- `cookieAdapter().name` now returns `ps_consent`. Server code that reads the consent cookie should use that property rather than a hardcoded string.
- Clearing consent from SSR should switch to the new `getSetCookieHeaders(record)`, which returns every `Set-Cookie` header to emit — on clear that includes one expiring the legacy cookie. The existing singular `getSetCookieHeader` is unchanged and still covers only the canonical cookie, so clearing through it leaves `oc_consent` behind.

The Vite consent scanner previously treated a JSX element as a gate only when it was literally named `ConsentGate`, so `import { ConsentGate as Gate }` silently defeated gating detection and correctly-gated code was reported as ungated (a build failure under `mode: "error"`). Aliased imports and namespaced usage (`import * as PS` → `<PS.ConsentGate>`) resolving to a PolicyStack package are now recognised. This is purely additive — a bare `<ConsentGate>` with no import still counts, so local wrappers, barrel re-exports and auto-imports keep working and no previously-clean project starts failing.
