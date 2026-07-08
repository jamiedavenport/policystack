# Cloud

> The control plane for your policies.

Centralized versioning, audit trails, and consent analytics across every app in your stack — without giving up the typed configs and headless primitives you already use.

**Status:** early access. Onboarding design partners through Q3 2026. [Book a demo](https://cal.eu/jamie-openpolicy/openpolicy-chat-demo).

## What Cloud adds on top

The open-source pieces are still doing the work. Cloud is the place to see them, version them, and prove what happened.

- **Policy registry** — Every published policy version, signed and timestamped. Diff between versions, see who approved what, roll back if you have to.
- **Consent analytics** — Acceptance rates by category, region, and surface. Funnel views to find the banner copy that actually works.
- **Cross-app config** — One source of truth for policies that span web, mobile, and backend services. SDKs pull the latest at boot, cached at the edge.
- **Audit log** — Every consent decision, every policy publish, every config change — exportable as JSONL for your compliance team.
- **DSAR inbox** — A simple intake for data subject requests, routed to whichever service holds the data, with a clock counting down to your SLA.
- **SSO + SAML** — SCIM provisioning, role-based access, IP allowlisting. The boring enterprise checklist, on by default.

## Pricing

We're in private beta with a handful of design partners. Pricing will be usage-based and boring. Open source stays open source.

- **Open source — $0.** Self-hosted. Apache-2.0. Yours forever. Includes Policy, Consent, Vite plugin, CLI.
- **Cloud — usage-based.** The hosted control plane, billed on consents and policy publishes. Policy registry, consent analytics, cross-app config, audit log.
- **Enterprise — talk to us.** For teams with procurement, security questionnaires, and a DPA. SSO + SCIM, custom retention, region pinning, support SLA.

## See it in action

We're onboarding design partners through Q3 2026. Book a 30-minute call and we'll walk you through the control plane.

- Demo: <https://cal.eu/jamie-openpolicy/openpolicy-chat-demo>
- Underlying OSS: [Policy](https://policystack.dev/policy.md), [Consent](https://policystack.dev/consent.md)
