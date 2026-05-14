---
"@openpolicy/core": patch
---

Add German (`"de"`), Dutch (`"nl"`), and Spanish (`"es"`) locale support. Pass any of them to `defineConfig({ locale })` — or as a `locale` prop on `<PrivacyPolicy />` / `<CookiePolicy />` from `@openpolicy/react` — to render the policy in that language.

Each dictionary translates every OpenPolicy-emitted string using formal legal register and regulator-aligned terminology:

- **de** — DSGVO style (Verantwortlicher, Datenschutzbeauftragter, "Artikel 6 Absatz 1 Buchstabe a DSGVO")
- **nl** — AVG style (Verwerkingsverantwoordelijke, Functionaris voor gegevensbescherming, "artikel 6, lid 1, onder a) AVG")
- **es** — RGPD style (Responsable del tratamiento, Delegado de Protección de Datos, "artículo 6, apartado 1, letra a) del RGPD")

Effective dates render in locale-appropriate long form via `Intl.DateTimeFormat`: `"1. Januar 2026"` (de), `"1 januari 2026"` (nl), `"1 de enero de 2026"` (es).

User-supplied content (company info, processing purposes, retention text, third-party purposes, etc.) is passed through unchanged in whatever language the config wrote it.

**Note for production use:** the GDPR/CCPA/UK-GDPR boilerplate paragraphs in each dictionary are first-pass legal text. Have a native-speaking compliance reviewer or counsel sign off before relying on the output for jurisdictions you operate in.
