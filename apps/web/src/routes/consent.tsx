import { createFileRoute } from "@tanstack/react-router";
import { FeatureGrid, Install, ProductHero } from "./policy";
import { highlight } from "../lib/shiki";
import { WindowFrame } from "../components/CodeBlock";
import { Highlight } from "../components/Highlight";
import { Sponsor } from "../components/Sponsor";
import { pageMeta } from "../lib/seo";

const HERO_SNIPPET = `import {
  PolicyStackConsentProvider,
  ConsentGate,
} from "@policystack/react/consent";

const config = {
  categories: [
    { key: "essential", label: "Essential", locked: true },
    { key: "analytics", label: "Analytics" },
    { key: "marketing", label: "Marketing" },
  ],
};

export function App() {
  return (
    <PolicyStackConsentProvider config={config}>
      <YourApp />
      <ConsentGate requires="analytics">
        <GoogleAnalytics />
      </ConsentGate>
    </PolicyStackConsentProvider>
  );
}`;

const INSTALL_SNIPPET = `pnpm add @policystack/core/consent @policystack/react/consent`;

const USE_SNIPPET = `import { useConsent } from "@policystack/react/consent";

export function CookieBanner() {
  const { acceptAll, acceptNecessary } = useConsent();
  return (
    <div>
      <button onClick={acceptAll}>Accept all</button>
      <button onClick={acceptNecessary}>Necessary only</button>
    </div>
  );
}`;

export const Route = createFileRoute("/consent")({
	component: ConsentPage,
	head: (ctx) =>
		pageMeta(
			{
				title: "PolicyStack Consent — a headless consent state machine | PolicyStack",
				description:
					"Sub-4kb headless consent state machine with adapters for React, Vue, Solid, Svelte, and Angular. A Vite plugin flags ungated cookies at dev time.",
				path: "/consent",
			},
			ctx,
		),
	loader: async () => {
		const [heroHtml, installHtml, useHtml] = await highlight({
			data: {
				items: [
					{ code: HERO_SNIPPET, lang: "tsx" },
					{ code: INSTALL_SNIPPET, lang: "bash" },
					{ code: USE_SNIPPET, lang: "tsx" },
				],
			},
		});
		return { heroHtml, installHtml, useHtml };
	},
});

function ConsentPage() {
	const { heroHtml, installHtml, useHtml } = Route.useLoaderData();
	return (
		<>
			<ProductHero
				slug="consent"
				version="sub-4kb · pre-1.0"
				title={
					<>
						A <Highlight>headless</Highlight> consent state machine.
					</>
				}
				body="Tiny core. Adapters for every major framework. A Vite plugin that yells at you when a script sets a cookie behind a category the user hasn’t accepted yet."
				primary={{
					label: "pnpm add @policystack/react/consent",
					href: "#install",
					icon: "arrow-right",
				}}
				secondary={{
					label: "github",
					href: "https://github.com/jamiedavenport/policystack",
					icon: "arrow-up-right",
				}}
				snippetFile="App.tsx"
				html={heroHtml}
			/>

			<FeatureGrid
				index="01"
				eyebrow="what it does"
				title={
					<>
						Just the consent layer. <Highlight>Nothing else.</Highlight>
					</>
				}
				features={[
					{
						n: "01",
						title: "Headless core",
						body: "A state machine that tracks categories, persists choices, and emits events. The UI is whatever you build.",
					},
					{
						n: "02",
						title: "Framework adapters",
						body: "First-class hooks for React, Vue, Solid, Svelte, and Angular. Same store, same events, framework-idiomatic API.",
					},
					{
						n: "03",
						title: "Vite plugin",
						body: "Watches for cookie writes during dev. Throws if a script sets a cookie behind a category the user hasn’t accepted.",
					},
					{
						n: "04",
						title: "Static scanner",
						body: "CI step that scans built bundles for ungated cookie usage so things don’t regress between releases.",
					},
					{
						n: "05",
						title: "Integrations",
						body: "GA, Meta Pixel, GTM, Hotjar, PostHog — load them gated behind the right consent category by default.",
					},
					{
						n: "06",
						title: "CLI (planned)",
						body: "Bootstrap a config from your existing cookies, audit a deployed site, generate a per-environment policy.",
					},
				]}
			/>

			<DevPlugin />

			<Install
				id="install"
				index="03"
				commands={[
					{ tag: "bash", html: installHtml },
					{ tag: "CookieBanner.tsx", html: useHtml },
				]}
				next={{ to: "/policy", label: "Already using PolicyStack? Wire them together" }}
			/>

			<Sponsor index="04" />
		</>
	);
}

function DevPlugin() {
	return (
		<section className="border-b-2 border-black bg-black text-white">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-white/60 uppercase">
					<span className="text-white">[02]</span>
					<span className="h-0.5 w-10 bg-white/40" aria-hidden="true" />
					<span>dev plugin</span>
				</div>
				<div className="mt-16 grid gap-20 md:grid-cols-[1fr_1.2fr]">
					<div>
						<h2 className="max-w-[22ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
							Catch leaky cookies <Highlight>before users do.</Highlight>
						</h2>
						<p className="mt-8 max-w-[55ch] text-pretty text-white/70">
							The Vite plugin patches <span className="text-white">document.cookie</span> in dev and
							refuses writes that fall outside the categories the user has accepted — with a stack
							trace pointing at the line that did it.
						</p>
					</div>
					<WindowFrame
						title="vite dev — terminal"
						right={<span className="text-[#ff5f57]">! consent violation</span>}
					>
						<pre className="overflow-x-auto p-6 font-mono text-[0.8125rem] leading-6 text-white/90">
							{`[policystack] ungated cookie write blocked
  cookie:    _ga
  category:  analytics  (not accepted)
  source:    src/lib/analytics.ts:18:5
  fix:       guard with consent.has("analytics")`}
						</pre>
					</WindowFrame>
				</div>
			</div>
		</section>
	);
}
