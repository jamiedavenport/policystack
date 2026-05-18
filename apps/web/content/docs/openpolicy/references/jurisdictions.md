---
title: Supported jurisdictions
description: The canonical list of jurisdiction codes OpenPolicy accepts and what each one ships
product: openpolicy
---

OpenPolicy uses ISO-style region codes for the `jurisdictions` field in your `policystack.ts`. Every code in the list below is **type-valid** — TypeScript will accept it and the runtime validator won't reject it. Only some of them currently trigger **shipped content** (jurisdiction-specific policy sections and user rights); the rest are reserved for future releases.

There is no `"us"` code. US privacy law is state-level — pick the specific state codes that apply to your users (today: `"us-ca"` for California). There are also no regulation-name aliases like `"gdpr"` or `"ccpa"` — use the region code the regulation applies to.

## Codes

| Code    | Region          | Regulation(s)      | 0.1.0 content |
| ------- | --------------- | ------------------ | ------------- |
| `eu`    | European Union  | GDPR               | ✅ shipped    |
| `uk`    | United Kingdom  | UK-GDPR + DPA 2018 | ✅ shipped    |
| `us-ca` | California, USA | CCPA / CPRA        | ✅ shipped    |
| `us-va` | Virginia, USA   | VCDPA              | reserved      |
| `us-co` | Colorado, USA   | CPA                | reserved      |
| `br`    | Brazil          | LGPD               | reserved      |
| `ca`    | Canada          | PIPEDA             | reserved      |
| `au`    | Australia       | Privacy Act 1988   | reserved      |
| `jp`    | Japan           | APPI               | reserved      |
| `sg`    | Singapore       | PDPA               | reserved      |

**Shipped** means the renderer adds a jurisdiction-specific supplement section to your policy and derives the relevant user rights. **Reserved** means the code is accepted (so you can declare your regulatory surface now without a breaking change later) but no content renders for it yet.

## What each shipped code adds

### `eu` — GDPR

- **Legal basis** section (Article 13)
- **GDPR supplemental disclosures** (data controller, transfer safeguards, complaint rights)
- **User rights**: access, rectification, erasure, portability, restriction, objection
- **Cookie policy**: European-user disclosure under ePrivacy + GDPR consent rules

### `uk` — UK-GDPR

- **Legal basis** section (Article 13)
- **UK-GDPR supplemental disclosures**: Information Commissioner's Office (ICO) named as the supervisory authority, link to the ICO complaint portal, Data Protection Act 2018 referenced as the implementing statute, UK international transfer safeguards
- **User rights**: same six rights as GDPR
- **Cookie policy**: UK-user disclosure under PECR + UK-GDPR consent rules

### `us-ca` — CCPA / CPRA

- **California Privacy Rights** supplement (Right to Know, Right to Delete, Right to Opt-Out, Right to Non-Discrimination)
- **User rights**: access, erasure, opt_out_sale, non_discrimination

## Combining codes

When multiple codes apply, their content is combined — user rights are deduplicated and ordered canonically, and each jurisdiction-specific supplement renders once. For example:

```ts
jurisdictions: ["eu", "uk", "us-ca"],
```

produces a policy with GDPR, UK-GDPR, and CCPA supplements, plus the union of all three rights sets.

## Validation

The runtime validator rejects any code that isn't on the list above with a helpful error:

```
Unknown jurisdiction "us" — valid codes: eu, uk, us-ca, us-va, us-co, br, ca, au, jp, sg
```

If you upgrade from an earlier release and see this error, replace `"us"` with the specific state code your users are in (today, `"us-ca"`) and replace `"ca"` with `"us-ca"` if you meant California.
