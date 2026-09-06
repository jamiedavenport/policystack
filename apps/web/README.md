# policystack.dev

The public PolicyStack website uses **Blume 1.5.3**, static output, and Blume's default styling. It contains one landing page, V1 documentation, a historical blog, a public V2 roadmap, and a generated privacy policy. OpenPanel provides website analytics. There are no hosted AI services.

## Development and validation

Run from the repository root with Node 24 and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm --filter @policystack/core --filter @policystack/sdk --filter @policystack/renderers build
pnpm --filter web dev
```

The website runs on port 3000. Its local package dependencies must be built first because the content preparation step imports their published entry points.

```sh
pnpm --filter web build
pnpm --filter web preview
pnpm --filter web check-types
pnpm --filter web test
vp check
vp run knip
```

CI also runs `vp run -r build`, `vp run -r check-types`, and `vp run -r test`. The website's tests require a production build and cover legacy URLs, HTML/Markdown links, metadata, AI outputs, discovery questions, redirects, and a disposable V1 archive build. Run build/check sequentially: both regenerate `.blume`.

Blume owns `.blume/`, `.astro/`, and `dist/`; never edit or commit them. The direct Astro development dependency supplies types for authored Astro pages. `gray-matter` reads blog metadata; `node-html-parser` supports the output/link checks. No application React runtime is required.

## Content and AI discoverability

- `content/index.md` is the landing-page source, reused by the custom Astro page and Markdown mirror.
- `content/docs/` contains current V1 docs. Keep existing URLs; group them through the configured sidebar.
- `content/blog/` contains dated posts with `type: blog`, `date`, `authors`, and `description`. The Astro index and Markdown index are generated from those posts.
- `content/docs/roadmap.md` is planned direction, not API documentation. It and historical posts use `ai.exclude: true` to keep them out of the consolidated current reference. This does not block their public HTML/Markdown or search visibility.
- `policystack.ts` declares this website's privacy practices. `scripts/prepare.mjs` generates the privacy Markdown and `public/sdk.txt` using the actual PolicyStack compiler and SDK reference generator.

Start documentation pages with a direct answer and explicit V1 context. Include accurate imports, prerequisites, complete minimal examples, expected behaviour, and limits. Use descriptive headings and stable anchors. Link implementation evidence where it resolves ambiguity. Review dates describe actual content review, not the latest build date.

The source of current behaviour is the implemented packages, cross-checked against `../../docs/v1.md`. The V2 design document supplies roadmap direction only. Correct historical claims with visible notes and current-doc links.

Public agent entry points are `/llms.txt`, `/llms-full.txt`, `/sdk.txt`, `/agent-readability.json`, and `.md` page mirrors. The build finalizer adds the SDK reference and version guidance to Blume's generated LLM index; 1.5.3 does not support the newer `ai.llmsTxt.details` option. It also emits the blog-index Markdown and makes Markdown links absolute. Keep HTML and machine-readable content based on the same authored sources.

Public documentation renders without JavaScript. Static deployment uses explicit `.md` URLs; no content-negotiation support is advertised. Search uses local Orama. Ask AI and hosted MCP remain disabled. The generated agent workflow skills stay maintained by the SDK; the agent guide links their canonical source.

## Releasing V2 documentation

Do not publish placeholder V2 API pages. When V2 is ready:

```sh
pnpm --filter web version:snapshot v1
```

This copies only current documentation to `content/v1/docs/`, excluding the roadmap, preserves examples, rewrites internal docs links, creates `/v1`, and registers the archive in `versions.json`. It refuses to overwrite an archive. Blume's own 1.5.3 `version` command copies the entire content root, so use this wrapper for this mixed website.

Then update `versions.json`'s current label to `V2`, replace current docs with reviewed V2 material, and add migration guidance and support policy. Current URLs remain `/docs/**`; the archive lives at `/v1/docs/**`. Blog, landing page, privacy, roadmap, and SDK reference remain current. Archived readers must use the SDK reference shipped with their installed V1 package; `/sdk.txt` always follows the current workspace SDK.

Run the production build and tests. Check the native version selector, archive notice, links, scoped search, canonical URLs, and agent indexes before release. Do not edit frozen archives as if they describe the current product.

## Deployment and compatibility

### OpenPanel analytics

Set `PUBLIC_OPENPANEL_CLIENT_ID` to the project's public web client ID in the existing Vercel project's **Production** environment, then rebuild/deploy. In OpenPanel, allow `https://policystack.dev` as an origin for that client. No client secret is used or exposed. The SDK is loaded and initialized only when the ID is set and `VERCEL_ENV=production`; local development, ordinary local builds, and Vercel previews omit tracking.

`components/OpenPanel.astro` loads `@openpanel/web`, the shared npm SDK recommended by OpenPanel's React documentation, to track page views, outgoing links, and explicitly marked `data-track` events. `components.ts` adds it to Blume's footer slot; `SitePage.astro` includes it for the landing page and blog index. Astro executes the bundled module once, and the SDK handles browser history navigation. Account identification and session replay are not enabled. Website disclosures live in `policystack.ts` and `scripts/prepare.mjs`.

For a local production-output check, run `VERCEL_ENV=production PUBLIC_OPENPANEL_CLIENT_ID=<public-client-id> pnpm --filter web build`, then run the website tests with the same environment. After deployment, check a page load and an internal navigation in OpenPanel's realtime view.

Implementation reference: [OpenPanel React integration](https://openpanel.dev/docs/sdks/react), consulted through Context7 library ID `/websites/openpanel_dev` (unversioned documentation; installed `@openpanel/web` version 1.4.1).

### Vercel

Keep the existing Vercel project and `policystack.dev` domain, with project root **apps/web** and output directory **dist**. The checked-in `vercel.json` specifies the workspace install, dependency builds, HTTP redirects, and Markdown/text headers. Enable Vercel's setting that includes files outside the project root. No runtime credentials are required to build.

`redirects.json` drives Blume's redirects. Keep the root Vercel redirect list in sync; tests enforce parity. Blume's generated `dist/vercel.json` is not read by Vercel's Git integration, so the checked-in config is necessary. `apps/www` remains the `openpolicy.sh` redirect project and points directly to final URLs.

Deploy a Vercel preview before promotion. `VERCEL_ENV=preview` emits a disallow-all robots file and noindex HTML. Verify real 301 responses, UTF-8 Markdown/text responses, the feed, unknown-route 404s, and production canonical URLs. Promote the validated deployment; retain the previous deployment for rollback. Preview and production promotion require access to the existing Vercel project and are not performed by local scripts.

Blume was researched through Context7 library ID `/haydenbleasel/blume`. Current docs reference newer releases; the implementation uses the installed 1.5.3 package schemas and source. That release was selected to retain the repository's seven-day dependency release-age policy.
