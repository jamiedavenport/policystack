---
"@policystack/core": minor
"@policystack/react": minor
---

Consent hooks no longer cause hydration mismatches under SSR. The React hooks passed live store state as `useSyncExternalStore`'s `getServerSnapshot`, so any returning visitor mismatched: the server has no stored record and resolves the _host's_ timezone, while the client has both (#158). Every SSR consumer had to hand-roll a `mounted` flag around consent-driven UI.

`ConsentStore` gains a `server` member (`getState()` / `has()`) returning a deterministic pre-consent snapshot: undecided, no jurisdiction, conservative opt-in posture, derived from static config alone and never from the adapter or resolver. `useConsent`, `useCategory`, and `ConsentGate` pass it as `getServerSnapshot`, and React re-reads live state once hydration commits.

The Vue, Svelte, Solid, and Angular bindings still seed from live state and are unchanged here; `store.server` is the shared primitive their fix will use.
