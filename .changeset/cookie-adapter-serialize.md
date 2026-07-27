---
"@policystack/core": minor
---

`cookieAdapter()` now exposes the bare cookie value, so nothing has to re-implement its wire format (#167). `encode`/`decode` already existed as private closures; the adapter just never returned them, leaving `getSetCookieHeader()` (a whole `Set-Cookie` header) as the closest thing and forcing consumers to hand-roll base64url or string-parse the value back out.

Three new members on `CookieAdapter`:

- `serialize(record)` — the encoded cookie value on its own, exactly what `write()` puts in the cookie.
- `deserialize(value)` — the inverse, for a bare value. `parse()` still handles a full cookie header.
- `name` — the resolved cookie name, so callers using the default do not hardcode `oc_consent`.

The motivating case is seeding consent in browser tests, where `browserContext.addCookies()` needs a name and a value:

```ts
const adapter = cookieAdapter();
const store = createConsentStore(policystack);
store.acceptAll();

await context.addCookies([
	{ name: adapter.name, value: adapter.serialize(store.getConsentRecord()), url: baseURL },
]);
```

A copied encoder is worth replacing here even though it matches today: `deserialize` swallows errors and returns `null`, so a value that drifts from the adapter's format does not throw — consent silently reads as undecided and the banner reappears.
