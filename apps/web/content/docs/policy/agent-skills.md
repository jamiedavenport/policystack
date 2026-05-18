---
title: AI skill pack
description: Install the PolicyStack skill pack into Claude Code — guided procedures for setup, auditing, jurisdiction posture, and instrumentation
product: policy
---

`llms.txt` gives a coding agent the _facts_ about the SDK. The **skill pack**
gives it the _procedures_ — the closed loops that compose the CLI, the
provider, and the build-time scanner into repeatable workflows. It ships as a
Claude Code plugin, versioned in the monorepo and generated from the same
frozen SDK types as `llms.txt`, so a skill can never reference a jurisdiction
or diagnostic code that no longer exists.

PolicyStack generates policy documents; it is not legal advice. Have a lawyer
review your policies before publication.

## Install

In Claude Code:

```
/plugin marketplace add jamiedavenport/policystack
/plugin install policystack
```

The four skills then activate automatically when a task matches.

## The skills

- **policystack-init** — scaffold PolicyStack in a project: run
  `@policystack/cli init`, then wire `<PolicyStackProvider>` (it supplies both
  the policy context and the consent store from one config).
- **policystack-audit** — the closed loop: run `policy validate --json`,
  explain each issue code against the frozen 1.0 diagnostic surface, propose a
  minimal config fix, and re-validate until the config is clean.
- **policystack-jurisdiction** — explain the consent-model and policy-text
  posture implied by a declared `jurisdictions` set, read straight from the
  canonical jurisdiction table.
- **policystack-instrument** — find un-annotated data collection and data
  egress in a codebase and add `collecting()` / `sharing()` / `thirdParty()` /
  `defineCookie()` call sites so the generated policy matches reality.

## Why it can't drift

Every enumeration a skill cites — jurisdiction ids, lawful bases, the issue
codes `validate()` emits — is rendered from the live `@policystack/core` /
`@policystack/sdk` tables at generation time and snapshotted with a drift test
that fails the build if the generated pack and the shipped files disagree. The
same mechanism backs [`llms.txt`](/docs/policy/cli). Removing or renaming a
frozen code is a loud test failure, not a silently stale skill.

You can also point any other agent at the local reference: `policy init`
writes `policystack.llms.txt` into your project — see the
[CLI page](/docs/policy/cli).
