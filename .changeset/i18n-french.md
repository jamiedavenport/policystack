---
"@openpolicy/core": patch
---

Add French (`"fr"`) locale support. Pass `locale: "fr"` to `defineConfig()` to emit a privacy or cookie policy in French:

```ts
defineConfig({
	// ...
	locale: "fr",
});
```

Translates every OpenPolicy-emitted string (~125 entries) into French, using RGPD legal register and standard EU regulatory terminology (e.g. "responsable du traitement", "Délégué à la protection des données", "article 6, paragraphe 1, point a)"). User-supplied strings (company name, processing purposes, retention, third-party purposes, etc.) pass through unchanged — you control their language.

Effective dates now render in locale-appropriate long form via `Intl.DateTimeFormat` — `"2026-01-01"` becomes `"January 1, 2026"` (en) or `"1 janvier 2026"` (fr). Dates are pinned to UTC to avoid timezone shifts across build servers.

**Note for production use:** the GDPR/CCPA/UK-GDPR boilerplate paragraphs in `fr.ts` are first-pass legal text. Have a French-speaking compliance reviewer or counsel sign off before relying on the French output for jurisdictions you operate in.
