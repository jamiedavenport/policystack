---
title: Introduction
description: What Policy is and why it exists
product: policy
---

Policy generates privacy policies and cookie policies from TypeScript config files. Instead of maintaining documents manually or copying templates, you describe your actual data practices in code and Policy renders them as components inside your app.

## What you can do with it

- **Render as components** — drop `<PrivacyPolicy />` or `<CookiePolicy />` directly into your React or Vue app
- **Auto-collect** — scan your source for `collecting()` and `thirdParty()` annotations at build time so the policy stays in sync with the code
- **Pair with a consent banner** — the same config drives a [Consent](/docs/consent) banner and preferences panel, with no second config

## Get set up in one command

```sh
bunx @policystack/cli init
```

The CLI installs the right packages for your stack, writes a starter `policystack.ts`, and prints a prompt you can paste into a coding agent (Claude Code, Cursor, etc.) to finish filling in your config from your codebase. See the [CLI page](/docs/policy/cli).

## Why policies-as-code

Policy documents go stale. When you add a new third-party service, change your data retention period, or expand to a new jurisdiction, a static document won't reflect that unless someone remembers to update it. With Policy, your policy config lives next to your codebase — it can be reviewed in PRs, diffed in git, and re-rendered any time something changes.
