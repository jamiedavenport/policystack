# PolicyStack

> Privacy and consent, as primitives.

PolicyStack ships small, composable building blocks that let teams handle privacy and consent the way they handle auth, payments, or feature flags — as code, in their stack, version-controlled, testable, and ready for AI agents.

## The thesis

Today's privacy story is heavy SaaS banners glued to hand-written legal pages. Nothing composes with your stack. Nothing is testable. Nothing speaks to AI agents.

PolicyStack is built on the opposite premise: consent and policy are _infrastructure_. They belong in your repo, behind types, in your tests, and out of the way.

## Three building blocks

Each repo is independently useful and Apache-2.0 licensed. PolicyStack Cloud sits on top when you want a hosted control plane.

- **[PolicyStack Consent](https://policystack.dev/consent.md)** — A headless consent state machine. Sub-4kb core with adapters for React, Vue, Solid, Svelte, and Angular. A Vite plugin flags ungated cookies at dev time. Integrations for GA, Meta Pixel, and more. (`@policystack/react/consent`)
- **[PolicyStack](https://policystack.dev/policy.md)** — Your policy as a typed config. Define your privacy and cookie policy once in TypeScript. Render it as React components, or generate Markdown. Ships a shadcn-style consent banner. (`@policystack/react`)
- **[PolicyStack Cloud](https://policystack.dev/cloud.md)** — The hosted control plane. Centralized policy versioning, audit trails, and consent analytics across every app in your stack. Optional. Plays nicely with the OSS pieces. (early access)

## Good DX that agents love

We didn't design PolicyStack for AI. We designed it so a human could grep their policy, diff a consent rule in a PR, and trust that what's rendered matches what's tested.

Claude reading the same typed config is just what falls out. The machine-readable surface isn't the goal — it's the receipt.

## Principles

- **Version-controlled** — Policies live next to your code. Changes go through PR review, not a vendor dashboard.
- **Testable** — Type-checked configs, snapshot tests for rendered policy, unit tests for consent state.
- **Composable** — Headless cores with framework adapters. Use the parts you want, swap the ones you don't.
- **Tiny** — PolicyStack Consent core ships under 4kb gzipped. PolicyStack renders zero JS by default.
- **Open source** — Apache-2.0 across the board. PolicyStack Cloud is the only commercial piece, and it's optional.
- **Honest** — It generates documents and manages state. It does not give legal advice.

## Get started

Pick a repo, install one package, and have a typed policy and a working consent flow before lunch.

- Docs: <https://policystack.dev/docs>
- GitHub (PolicyStack): <https://github.com/jamiedavenport/policystack>
- GitHub (PolicyStack Consent): <https://github.com/jamiedavenport/policystack>
- Demo (PolicyStack Cloud): <https://cal.eu/jamie-policy/policy-chat-demo>
