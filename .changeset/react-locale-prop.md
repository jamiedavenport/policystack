---
"@openpolicy/react": patch
---

Add an optional `locale` prop to `<PrivacyPolicy />` and `<CookiePolicy />`. Overrides `config.locale` at render time, so a single config can render multiple locales side-by-side:

```tsx
<OpenPolicy config={openpolicy}>
	<PrivacyPolicy /> {/* uses config.locale */}
	<PrivacyPolicy locale="fr" /> {/* overrides → French */}
</OpenPolicy>
```

Only OpenPolicy-emitted strings (headings, table headers, GDPR/CCPA disclosures, formatted dates) change with the locale. User-supplied content (company info, purposes, retention text, etc.) renders as-written.
