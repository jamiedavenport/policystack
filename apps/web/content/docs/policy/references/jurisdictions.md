---
title: Supported jurisdictions
description: The canonical list of jurisdiction codes Policy accepts and what each one ships
---

> **PolicyStack V1** — current documentation. [Supported capabilities and limitations](/docs/reference/support).

Policy uses lowercase-kebab region codes for the `jurisdictions` field in your `policystack.ts`. `JurisdictionId` includes seven top-level regions and all 50 US states. TypeScript accepts only these codes and the runtime validator rejects anything else; there is no second enum and no migration alias.

There are no regulation-name aliases like `"gdpr"` or `"ccpa"` — use the region code the regulation applies to. The code for the EU/EEA is `"eea"`, not `"eu"`: GDPR applies EEA-wide.

## Codes

Every supported region resolves to one of two tiers:

- **`specific`** — hand-authored, jurisdiction-precise policy text and user rights.
- **`equivalent`** — posture-correct (opt-in vs. opt-out) with parent-jurisdiction text, plus a suppressible `jurisdiction-generic-policy-text` validator warning so the honesty gap is visible. A legitimate, shippable tier — a member's tier may be upgraded post-1.0 without a breaking change.

| Code         | Region                  | Regulation(s)               | Tier         |
| ------------ | ----------------------- | --------------------------- | ------------ |
| `eea`        | European Economic Area  | GDPR                        | `specific`   |
| `uk`         | United Kingdom          | UK-GDPR + PECR              | `specific`   |
| `us-ca`      | California, USA         | CCPA / CPRA                 | `specific`   |
| `ch`         | Switzerland             | revFADP                     | `equivalent` |
| `br`         | Brazil                  | LGPD                        | `equivalent` |
| `ca`         | Canada                  | PIPEDA (+ Quebec Law 25)    | `equivalent` |
| `us`         | United States (federal) | Federal baseline, opt-out   | `equivalent` |
| `us-<state>` | Any US state            | State privacy law posture   | `equivalent` |
| `row`        | Rest of world           | Conservative opt-in default | `equivalent` |

US privacy law is state-level. `"us"` is the federal opt-out baseline; use the lowercase ISO postal code for a state, such as `"us-ca"`, `"us-fl"`, or `"us-tx"`. All 50 state codes inherit text and posture from `"us"` as their parent. California is the only state currently upgraded to hand-authored `specific` policy text.

```text
us-al us-ak us-az us-ar us-ca us-co us-ct us-de us-fl us-ga
us-hi us-id us-il us-in us-ia us-ks us-ky us-la us-me us-md
us-ma us-mi us-mn us-ms us-mo us-mt us-ne us-nv us-nh us-nj
us-nm us-ny us-nc us-nd us-oh us-ok us-or us-pa us-ri us-sc
us-sd us-tn us-tx us-ut us-vt us-va us-wa us-wv us-wi us-wy
```

For programmatic checks, core and the SDK export `US_STATE_JURISDICTION_IDS`, `USStateJurisdictionId`, and the `isUSStateJurisdictionId()` type guard.

## What each `specific` code adds

### `eea` — GDPR

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
jurisdictions: ["eea", "uk", "us-ca"],
```

produces a policy with GDPR, UK-GDPR, and CCPA supplements, plus the union of all three rights sets.

## Validation

The runtime validator rejects any code that isn't a member of the union with compact guidance:

```
Unknown jurisdiction "eu" — valid top-level codes: eea, uk, ch, br, ca, us, row; US states use us-<postal-code> (for example, us-ca or us-tx)
```

If you are upgrading from a pre-1.0 release, the common migration is `"eu"` → `"eea"`. The codes `"au"`, `"jp"`, and `"sg"` are not canonical jurisdictions and are rejected — declare `"row"` for a conservative opt-in fallback if you serve those regions.
