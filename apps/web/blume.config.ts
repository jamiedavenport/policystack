import { defineConfig } from "blume";
import redirects from "./redirects.json";
import versions from "./versions.json";

export default defineConfig({
	title: "PolicyStack",
	logo: {
		image: { light: "/wordmark.svg", dark: "/wordmark-dark.svg", alt: "PolicyStack" },
		text: "",
	},
	description:
		"Privacy policies and headless cookie consent from one TypeScript config. V1 documentation for developers and coding agents.",
	content: { root: "content", include: ["**/*.{md,mdx}"], pages: "pages" },
	deployment: { output: "static", site: "https://policystack.dev" },
	github: { owner: "jamiedavenport", repo: "policystack", branch: "main", dir: "apps/web" },
	versions,
	feedback: false,
	lastModified: true,
	navigation: {
		tabs: [
			{ label: "Docs", path: "/docs" },
			{ label: "Blog", path: "/blog", href: "/blog" },
		],
		featured: [
			{ label: "V2 Roadmap", href: "/docs/roadmap" },
			{ label: "Privacy", href: "/privacy" },
		],
		sidebar: [
			{
				label: "Docs",
				root: "/docs",
				items: [
					{ label: "Getting started", items: ["/docs", "/docs/quickstart"] },
					{
						label: "Policy",
						items: [
							"/docs/policy",
							"/docs/policy/configuration",
							"/docs/policy/policies/quick-start",
							"/docs/policy/policies/overview",
							"/docs/policy/policies/privacy",
							"/docs/policy/policies/cookies",
							"/docs/policy/react",
							"/docs/policy/vue",
							"/docs/policy/svelte",
							"/docs/policy/i18n",
						],
					},
					{
						label: "Consent",
						items: [
							"/docs/consent",
							"/docs/consent/core",
							"/docs/consent/react",
							"/docs/consent/vue",
							"/docs/consent/svelte",
							"/docs/consent/solid",
							"/docs/consent/angular",
							"/docs/consent/scripts",
						],
					},
					{
						label: "Tooling and agents",
						items: [
							"/docs/policy/cli",
							"/docs/consent/cli",
							"/docs/policy/agent-skills",
							"/docs/policy/policies/auto-collect",
							"/docs/consent/scanner",
							"/docs/consent/vite",
						],
					},
					{
						label: "Reference",
						items: [
							"/docs/reference/support",
							"/docs/policy/references/jurisdictions",
							"/docs/policy/references/examples",
						],
					},
				],
			},
		],
	},
	ai: { llmsTxt: true, mcp: { enabled: false } },
	seo: {
		agentReadability: true,
		sitemap: true,
		robots: true,
		structuredData: true,
		rss: { enabled: true, types: ["blog"] },
	},
	redirects: redirects.map(({ from, to }) => ({ from, to, status: 301 })),
});
