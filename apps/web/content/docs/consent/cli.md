---
title: "@policystack/cli"
description: "Terminal UI for scans and config sync"
product: consent
---

Terminal entry point for Consent. Wraps [`@policystack/vite`](/docs/consent/scanner) for one-off scans, config init, and writing back vendor-category suggestions that the [Vite plugin](/docs/consent/vite) only prints.

> Status: scaffold. The package and `consent` bin are reserved; the implementation is in flight. For build-time scanning today, use [`@policystack/vite`](/docs/consent/vite) — same scanner, integrated with HMR and `vite build`.

## Install

```sh
bun add -D @policystack/cli
```

## Usage

```sh
consent --help
```

## Planned commands

- `consent scan` — run the scanner against a project, print findings.
- `consent init` — scaffold a starter `cookies.config.ts` with the categories the scanner detected.
- `consent sync` — apply the vendor-category suggestions the Vite plugin prints when `autoSync: true`, writing them to your config file.

Track progress in the repo issues.

## See also

- [`@policystack/vite`](/docs/consent/scanner) — the detection engine the CLI wraps
- [`@policystack/vite`](/docs/consent/vite) — recommended for in-editor / CI feedback today
- [`@policystack/core/consent`](/docs/consent/core) — runtime config the CLI generates and edits

## License

Apache-2.0
