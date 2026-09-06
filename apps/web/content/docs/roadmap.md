---
title: V2 roadmap — planned direction
description: PolicyStack V2 is in design. Explore the proposed self-hostable platform and design-partner programme; these capabilities are not shipped V1 features.
lastModified: 2026-09-06
ai:
  exclude: true
---

**V2 is in design. Everything described below is planned direction, not a shipped capability, API contract, price, or release commitment.** Use the [V1 support matrix](/docs/reference/support) for what works today.

## From libraries to a privacy platform

V1 already supplies typed configuration, policy generation, headless consent, and development diagnostics. The V2 direction connects those foundations to a shared privacy inventory: what data exists, whose data it is, where it goes, why it is processed, and which controls apply.

The proposed loop is: discover data flows, understand obligations, decide, enforce, fulfil rights, and verify outcomes. The ambition includes backend and polyglot applications, reviewed regulatory packs, retention and deletion, and auditable publication and activation.

## Delivery direction

1. Improve compatible V1 foundations and choose an initial journey with design partners.
2. Establish reviewed declarations, rule packs, semantic diffs, and traceable policy publication.
3. Pilot backend enforcement across one application, its data store, and a vendor.
4. Add rights and retention workflows with human review and explicit partial completion.
5. Stabilise contracts, migration guidance, and self-hosted packaging.

The initial integrations, jurisdictions, dates, and exact APIs remain open. V2 will compose with application authentication and access controls rather than replace them.

## Self-hosting

The direction is a self-hostable product with accessible source. Packaging and launch timing are undecided.

The proposed licensing split is permissive application SDKs and schemas with an ELv2 control plane, subject to legal and dependency review. This is an open-source/source-available boundary, not a claim that every future component is open source. Current V1 package licences remain Apache-2.0.

## Moving from V1

Continue compatible improvements on V1. V2 will require explicit migration guidance for changed contracts; old consent records must not be reinterpreted as broader consent. Support windows and conversion coverage are not yet defined. Documentation will keep a labelled V1 archive when V2 becomes current.

## Become a design partner

We are looking for real data journeys, current consent and policy workflows, integration constraints, and reviewers who can evaluate the result. Contact [jamie@policystack.dev](mailto:jamie@policystack.dev) to discuss participation. There are no implied private features or delivery guarantees.

The [working design decisions](https://github.com/jamiedavenport/policystack/blob/main/docs/v2.md) distinguish accepted direction from unresolved implementation questions.
