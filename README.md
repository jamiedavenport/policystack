[![PolicyStack](./images/banner.png)](https://policystack.dev)

# PolicyStack

Open-source, AI-first primitives for adding privacy policies and consent to your app. One typed config drives your privacy policy, your cookie policy, and the consent that gates the cookies they describe — all rendered directly into your React/Vue/Svelte/Solid/Angular app, never a third-party iframe.

- [Homepage](https://policystack.dev)
- [Documentation](https://policystack.dev/docs)
- [Blog](https://policystack.dev/blog)

## Three building blocks

- **[Policy](https://policystack.dev/docs/policy)** — your privacy and cookie policy as a typed config, rendered as components or Markdown. A Vite plugin compiles it at build time and scans for undeclared third parties.
- **[Consent](https://policystack.dev/docs/consent)** — a headless consent state machine. Sub-4kb core, adapters for React, Vue, Solid, Svelte, and Angular, and a Vite plugin that fails the build on an ungated cookie. No bundled UI — you build the banner with your own components.
- **Cloud** — an optional hosted control plane for versioning, audit trails, and consent analytics. It sits on top of the OSS pieces; you never need it to use them.

Everything except Cloud is Apache-2.0.

## Quick start

```bash
bunx @policystack/cli init
```

`init` installs the right packages for your stack, writes a starter `policystack.ts`, and prints a prompt you can hand to a coding agent. See the [quick start](https://policystack.dev/docs/policy/cli) for the full walkthrough.

## Packages

All packages publish under the `@policystack/*` scope and version together.

| Package                  | What it is                                                 |
| ------------------------ | ---------------------------------------------------------- |
| `@policystack/sdk`       | Public API — `defineConfig()`, `renderLlmsTxt()`           |
| `@policystack/core`      | Compilation engine + consent runtime (`./consent` subpath) |
| `@policystack/vite`      | Vite plugin + opt-in consent scanner                       |
| `@policystack/cli`       | Install / configure / validate CLI                         |
| `@policystack/renderers` | Shared Markdown / HTML / PDF render layer                  |
| `@policystack/scripts`   | Consent-gated third-party script loaders                   |
| `@policystack/react`     | React adapters — `./policy`, `./consent`, `./provider`     |
| `@policystack/vue`       | Vue adapters — `./policy`, `./consent`                     |
| `@policystack/svelte`    | Svelte adapters — `./policy`, `./consent`                  |
| `@policystack/solid`     | Solid adapter — `./consent`                                |
| `@policystack/angular`   | Angular adapter — `./consent`                              |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, the monorepo layout, and the release flow. Apache-2.0 — issues and PRs welcome.

> **Not legal advice.** PolicyStack generates policy documents from your config. It does not provide legal advice. Have a lawyer review your policies before publication. See the [legal notice](https://policystack.dev/legal-notice).

# Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.jxd.dev/"><img src="https://avatars.githubusercontent.com/u/1329874?v=4?s=100" width="100px;" alt="Jamie Davenport"/><br /><sub><b>Jamie Davenport</b></sub></a><br /><a href="https://github.com/jamiedavenport/policystack/commits?author=jamiedavenport" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jimbobware"><img src="https://avatars.githubusercontent.com/u/121758727?v=4?s=100" width="100px;" alt="James"/><br /><sub><b>James</b></sub></a><br /><a href="https://github.com/jamiedavenport/policystack/commits?author=jimbobware" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.vishvish.com/"><img src="https://avatars.githubusercontent.com/u/184423?v=4?s=100" width="100px;" alt="Vish"/><br /><sub><b>Vish</b></sub></a><br /><a href="https://github.com/jamiedavenport/policystack/commits?author=vishvish" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kdoroszewicz"><img src="https://avatars.githubusercontent.com/u/7294362?v=4?s=100" width="100px;" alt="Kamil Doroszewicz"/><br /><sub><b>Kamil Doroszewicz</b></sub></a><br /><a href="https://github.com/jamiedavenport/policystack/commits?author=kdoroszewicz" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

# Stargazers

[![RepoStars](https://repostars.dev/api/embed?repo=jamiedavenport%2Fpolicystack&theme=light)](https://repostars.dev/?repos=jamiedavenport%2Fpolicystack&theme=light)
