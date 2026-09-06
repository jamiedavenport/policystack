---
title: PolicyStack V1 documentation
description: Build privacy policies and headless cookie consent with PolicyStack V1. Start with a working TypeScript and React example or choose a framework adapter.
lastModified: 2026-09-06
sidebar:
  label: Overview
---

PolicyStack V1 provides privacy and cookie policy generation, headless consent, static source scanning, and tools for coding agents. One `PolicyStackConfig` supplies disclosures and consent categories. Your application owns the UI and runtime integration.

## Get started

1. Follow the [complete React and TypeScript quickstart](/docs/quickstart).
2. Choose [policy rendering](/docs/policy) or [cookie consent](/docs/consent), independently or together.
3. Check the [framework support matrix and current limitations](/docs/reference/support).
4. Add [Vite diagnostics](/docs/consent/vite) and [CLI validation](/docs/policy/cli) to development and CI.

## Find an answer

- [How do I generate a privacy policy?](/docs/policy/policies/quick-start)
- [How do I add cookie consent to React?](/docs/consent/react)
- [How do I configure company, data, and cookie declarations?](/docs/policy/configuration)
- [How do I detect ungated analytics?](/docs/consent/vite)
- [Which frameworks and output formats are supported?](/docs/reference/support)
- [How do I connect a coding agent?](/docs/policy/agent-skills)
- [What is planned for V2?](/docs/roadmap)

## For coding agents

Use [llms.txt](/llms.txt) to discover current documentation, [llms-full.txt](/llms-full.txt) for the current corpus, and [sdk.txt](/sdk.txt) for the generated SDK reference. Append `.md` to a documentation URL to retrieve plain Markdown, including code examples. Treat historical blog posts as historical and the V2 roadmap as unshipped direction.

## Current product boundary

PolicyStack V1 is a TypeScript-first library, not a hosted compliance service. It has no finished banner UI, self-hostable control plane, backend enforcement SDK, or data-subject request workflow. Generated documents and configured controls need human review. See the [support reference](/docs/reference/support) for exact coverage.
