---
title: Consent scanning with CLI and MCP tools
description: PolicyStack V1 ships init, validate, and mcp commands. Use Vite or the MCP scan_ungated tool for consent scanning; scan and sync shell commands are not implemented.
lastModified: 2026-09-06
---

PolicyStack V1's CLI implements `init`, `validate`, and `mcp`. Consent-specific `policystack scan` and `policystack sync` shell commands are not implemented.

## Validate your consent declarations

```sh
pnpm add -D @policystack/cli@1
pnpm exec policystack validate --json
```

This validates configuration; it does not scan every runtime data flow. Review the returned diagnostic codes and update the configuration or application as required.

## Scan source for ungated analytics

Use the [Vite integration](/docs/consent/vite) with consent scanning enabled, or configure a coding agent to run `pnpm exec policystack mcp` and call its `scan_ungated` tool. Both use the [static consent scanner](/docs/consent/scanner).

Static findings are heuristic. Configure Vite's error mode to fail CI on findings. Runtime gating still requires the application's consent APIs.

See the [CLI reference](/docs/policy/cli) for setup flags, validation, and MCP configuration.
