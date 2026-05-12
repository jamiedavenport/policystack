# openpolicy.sh → policystack.dev migration

OpenPolicy is folding into PolicyStack. This doc captures the redirect plan and the manual work needed to flip the DNS without losing inbound links or SEO equity.

## Strategy

Keep openpolicy.sh resolving (don't just drop the DNS) and serve a redirect map from it. **301** only the URLs whose destination is the new permanent canonical; **302** every soft/topical placeholder so we keep the option to port content into the matching URL on PolicyStack later. **410** the handful of posts we are deliberately retiring.

## Status code legend

- **301 Permanent** — same content (or the only correct canonical) lives at the new URL. Browsers cache aggressively.
- **302 Temporary** — best-effort topical landing. Lets us upgrade to 301 later, after the real content is ported.
- **410 Gone** — content is permanently removed; tells crawlers to drop it.

---

## Redirect table

### Top-level pages

| From (openpolicy.sh) | Status | To (policystack.dev) | Notes                                                  |
| -------------------- | ------ | -------------------- | ------------------------------------------------------ |
| `/`                  | 301    | `/`                  |                                                        |
| `/blog`              | 301    | `/blog`              |                                                        |
| `/privacy`           | 301    | `/privacy`           | **Add `/privacy` to PolicyStack before flipping DNS.** |
| `/legal-notice`      | 302    | `/privacy`           | Might split into a dedicated `/legal` page later.      |
| `/examples`          | 302    | `/openpolicy`        | Might build a real examples gallery later.             |
| `/404`               | —      | —                    | Static page, not a real URL. Drop.                     |
| `/api/waitlist`      | —      | —                    | Server endpoint, not user-facing. Drop.                |

### Blog posts

| From                              | Status | To                              | Notes                                                         |
| --------------------------------- | ------ | ------------------------------- | ------------------------------------------------------------- |
| `/blog/tanstack`                  | 301    | `/blog/tanstack-privacy-policy` | Same post, retitled. Already ported.                          |
| `/blog/astro`                     | 302    | `/blog/astro-cookie-banner`     | Weak match (different angle). Worth porting the original.     |
| `/blog/no-build-astro`            | 302    | `/blog/astro-cookie-banner`     | Same framework, weak match.                                   |
| `/blog/nextjs`                    | 302    | `/openpolicy`                   | No Next.js post on PolicyStack yet. **Worth porting.**        |
| `/blog/react`                     | 302    | `/openpolicy`                   |                                                               |
| `/blog/sveltekit`                 | 302    | `/openpolicy`                   |                                                               |
| `/blog/opencookies`               | 302    | `/opencookies`                  | Launch announcement → product page.                           |
| `/blog/headless-privacy-stack`    | 302    | `/`                             | Thesis post; homepage carries the thesis now.                 |
| `/blog/code-first`                | 302    | `/`                             | Thesis content. **Worth porting.**                            |
| `/blog/three-levels`              | 302    | `/openpolicy`                   | Product positioning.                                          |
| `/blog/beyond-the-privacy-policy` | 302    | `/openpolicy`                   |                                                               |
| `/blog/auto-collect`              | 302    | `/openpolicy`                   | Or `/docs/openpolicy/scanner` if you want depth over breadth. |
| `/blog/better-auth`               | 302    | `/opencookies`                  | Consent-tracking integration.                                 |
| `/blog/shadcn-registry`           | 302    | `/openpolicy`                   |                                                               |
| `/blog/legal-chatbot-ai-sdk`      | 410    | —                               | One-off demo.                                                 |
| `/blog/building-update-flows`     | 410    | —                               | Niche; topic not on the new roadmap surface.                  |

### Framework landing pages

| From                  | Status | To                        |
| --------------------- | ------ | ------------------------- |
| `/framework/react`    | 302    | `/docs/openpolicy/react`  |
| `/framework/svelte`   | 302    | `/docs/openpolicy/svelte` |
| `/framework/vue`      | 302    | `/docs/openpolicy/vue`    |
| `/framework/astro`    | 302    | `/openpolicy`             |
| `/framework/nextjs`   | 302    | `/openpolicy`             |
| `/framework/nuxt`     | 302    | `/openpolicy`             |
| `/framework/remix`    | 302    | `/openpolicy`             |
| `/framework/tanstack` | 302    | `/openpolicy`             |

### Comparison pages

| From                 | Status | To            |
| -------------------- | ------ | ------------- |
| `/compare/lawyers`   | 302    | `/openpolicy` |
| `/compare/templates` | 302    | `/openpolicy` |
| `/compare/termly`    | 302    | `/openpolicy` |
| `/compare/iubenda`   | 302    | `/openpolicy` |

### Wildcards / catch-alls

| From           | Status | To      | Notes                                                                            |
| -------------- | ------ | ------- | -------------------------------------------------------------------------------- |
| `/blog/tags/*` | 302    | `/blog` | No tag pages on PolicyStack.                                                     |
| `/og/*`        | 404    | —       | Old social-card image URLs; not user-facing.                                     |
| anything else  | 404    | —       | Falls through to PolicyStack's NotFound page, which already names the migration. |

---

## Manual tasks

### Before flipping DNS

- [ ] **Add a `/privacy` route to policystack.dev** so the `openpolicy.sh/privacy` redirect doesn't 404. Render it with OpenPolicy — dogfood.
- [ ] Decide where the redirects live. Options:
  - Keep this OpenPolicy repo deployed to Vercel but replace the Astro app with a redirect-only `vercel.json` (recommended — keeps the openpolicy.sh domain attached to its existing project).
  - Or, add openpolicy.sh as an additional domain on the PolicyStack Vercel project and gate redirects on the `Host` header.
- [ ] Write the redirect config from the table above (see implementation hint below).
- [ ] Optionally port high-value posts now so their redirects can ship as 301 from day one:
  - `code-first` (thesis post — brand-defining)
  - `nextjs` (likely the highest-traffic framework post)

### Flip day

- [ ] Deploy the redirect-only build to the openpolicy.sh Vercel project.
- [ ] Verify each row in the table with `curl -I`:
  ```bash
  curl -I https://openpolicy.sh/blog/tanstack       # expect 301 → /blog/tanstack-privacy-policy
  curl -I https://openpolicy.sh/blog/legal-chatbot-ai-sdk  # expect 410
  curl -I https://openpolicy.sh/blog/some-random    # expect 404
  ```
- [ ] Confirm SSL still renews on openpolicy.sh.

### After flipping

- [ ] In Google Search Console:
  - Submit the new policystack.dev sitemap.
  - File a **Change of Address** request from openpolicy.sh to policystack.dev. (This signal is only honoured for URLs returning 301 — the 302s won't move SEO equity until they're promoted.)
- [ ] Update external links pointing at openpolicy.sh:
  - GitHub repo descriptions (`jamiedavenport/openpolicy`, `jamiedavenport/opencookies`)
  - Twitter / Bluesky / personal site bios
  - Any package READMEs that still link to openpolicy.sh docs (`packages/*/README.md`)
- [ ] When you eventually port a post or build a real `/examples` page, promote its row in the table from 302 → 301 and redeploy.

---

## Operational notes

- **Don't let 302s get cached forever.** Set a short `Cache-Control` (5–60 min) on temporary redirect responses, otherwise some clients will treat them like 301s.
- **Host-gate the redirects** if you implement them inside PolicyStack rather than a standalone OpenPolicy deployment. Otherwise a future `policystack.dev/blog/nextjs` post would also redirect.
- **Keep this doc updated** as 302s get promoted to 301s. It is the source of truth for what links still need porting.

## Implementation hint: `vercel.json`

Replace the contents of this repo's `apps/www` with a near-empty project containing only this config. Vercel evaluates `redirects` before any build output.

```json
{
	"redirects": [
		{
			"source": "/blog/tanstack",
			"destination": "https://policystack.dev/blog/tanstack-privacy-policy",
			"permanent": true
		},
		{ "source": "/blog", "destination": "https://policystack.dev/blog", "permanent": true },
		{ "source": "/privacy", "destination": "https://policystack.dev/privacy", "permanent": true },

		{
			"source": "/blog/astro",
			"destination": "https://policystack.dev/blog/astro-cookie-banner",
			"permanent": false
		},
		{
			"source": "/blog/no-build-astro",
			"destination": "https://policystack.dev/blog/astro-cookie-banner",
			"permanent": false
		},
		{
			"source": "/blog/nextjs",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/blog/react",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/blog/sveltekit",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/blog/opencookies",
			"destination": "https://policystack.dev/opencookies",
			"permanent": false
		},
		{
			"source": "/blog/headless-privacy-stack",
			"destination": "https://policystack.dev/",
			"permanent": false
		},
		{ "source": "/blog/code-first", "destination": "https://policystack.dev/", "permanent": false },
		{
			"source": "/blog/three-levels",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/blog/beyond-the-privacy-policy",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/blog/auto-collect",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/blog/better-auth",
			"destination": "https://policystack.dev/opencookies",
			"permanent": false
		},
		{
			"source": "/blog/shadcn-registry",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},

		{
			"source": "/legal-notice",
			"destination": "https://policystack.dev/privacy",
			"permanent": false
		},
		{
			"source": "/examples",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},

		{
			"source": "/framework/react",
			"destination": "https://policystack.dev/docs/openpolicy/react",
			"permanent": false
		},
		{
			"source": "/framework/svelte",
			"destination": "https://policystack.dev/docs/openpolicy/svelte",
			"permanent": false
		},
		{
			"source": "/framework/vue",
			"destination": "https://policystack.dev/docs/openpolicy/vue",
			"permanent": false
		},
		{
			"source": "/framework/astro",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/framework/nextjs",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/framework/nuxt",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/framework/remix",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/framework/tanstack",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},

		{
			"source": "/compare/lawyers",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/compare/templates",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/compare/termly",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},
		{
			"source": "/compare/iubenda",
			"destination": "https://policystack.dev/openpolicy",
			"permanent": false
		},

		{
			"source": "/blog/tags/:tag*",
			"destination": "https://policystack.dev/blog",
			"permanent": false
		},

		{ "source": "/", "destination": "https://policystack.dev/", "permanent": true }
	],
	"headers": [
		{
			"source": "/(.*)",
			"headers": [{ "key": "Cache-Control", "value": "public, max-age=300" }]
		}
	]
}
```

Vercel returns **308** for `"permanent": true` and **307** for `"permanent": false` — both preserve the request method and are the modern equivalents of 301/302 for redirect purposes. If you need strict 301/410 semantics (e.g., for a search-engine signal), use Cloudflare bulk redirects or a Rewrite Rule instead.

The retired posts (`legal-chatbot-ai-sdk`, `building-update-flows`) and `/og/*` aren't in the config — they will fall through to a 404, which is functionally equivalent to 410 for crawlers given the rest of the site is moving. If you want literal 410s, those need a serverless function or a Cloudflare Worker.
