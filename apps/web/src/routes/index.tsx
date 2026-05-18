import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowDownIcon,
	ArrowRightIcon,
	CaretLeftIcon,
	CaretRightIcon,
	LockSimpleIcon,
	PlusIcon,
	ShareFatIcon,
	StarIcon,
} from "@phosphor-icons/react";
import { CodeBlock, WindowFrame } from "../components/CodeBlock";
import { Highlight } from "../components/Highlight";
import { Sponsor } from "../components/Sponsor";
import { highlight } from "../lib/shiki";
import { getStars } from "../lib/github-stars";
import { pageMeta } from "../lib/seo";

const HERO_SNIPPET = `import { defineConfig, LegalBases } from "@policystack/sdk";

export default defineConfig({
  company: {
    name: "Acme, Inc.",
    contact: { email: "privacy@acme.com" },
  },
  jurisdictions: ["eu", "us-ca"],
  data: {
    collected: {
      "Account Information": ["Name", "Email"],
      "Usage Data": ["Pages visited", "IP address"],
    },
  },
  cookies: {
    used: { essential: true, analytics: true, marketing: true },
  },
});`;

export const Route = createFileRoute("/")({
	component: Home,
	head: (ctx) =>
		pageMeta(
			{
				title: "PolicyStack — privacy and consent primitives for developers",
				description:
					"PolicyStack ships small, composable building blocks for privacy and consent — version-controlled, testable, and built for modern app architectures.",
				path: "/",
			},
			ctx,
		),
	loader: async () => {
		const [[heroHtml], stars] = await Promise.all([
			highlight({ data: { items: [{ code: HERO_SNIPPET, lang: "tsx" }] } }),
			getStars(),
		]);
		return { heroHtml, stars };
	},
});

function Home() {
	const { heroHtml, stars } = Route.useLoaderData();
	return (
		<>
			<Hero heroHtml={heroHtml} />
			<Thesis />
			<Products stars={stars} />
			<ForAgents />
			<Philosophy />
			<Sponsor index="05" />
			<CTA />
		</>
	);
}

function SectionMarker({ index, label }: { index: string; label: string }) {
	return (
		<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
			<span className="text-ink">[{index}]</span>
			<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
			<span>{label}</span>
		</div>
	);
}

function Hero({ heroHtml }: { heroHtml: string }) {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 pt-32 pb-32 md:pt-40 md:pb-40">
				<SectionMarker index="00" label="open source · v0" />
				<h1 className="mt-12 max-w-[18ch] text-5xl font-medium tracking-tight text-balance md:text-7xl">
					Privacy &amp; consent, <Highlight>as primitives.</Highlight>
				</h1>
				<p className="mt-12 max-w-[60ch] text-lg text-pretty text-mute">
					PolicyStack ships small, composable building blocks that let teams handle privacy and
					consent the way they handle auth, payments, or feature flags — as code, in their stack,
					version-controlled, testable, and ready for AI agents.
				</p>
				<div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-4">
					<a
						href="https://policystack.dev/docs"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black"
					>
						<ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
						read the docs
					</a>
					<a
						href="#products"
						className="inline-flex items-center gap-2.5 border-2 border-black px-6 py-3.5 text-sm tracking-wide uppercase hover:bg-black hover:text-white"
					>
						<ArrowDownIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
						browse products
					</a>
				</div>

				<div className="mt-24 grid gap-6 md:grid-cols-2 md:items-stretch">
					<div className="min-w-0 md:h-112">
						<CodeBlock className="h-full" file="policystack.ts" html={heroHtml} />
					</div>
					<div className="min-w-0 md:h-112">
						<BrowserPreview />
					</div>
				</div>
			</div>
		</section>
	);
}

const POLICY_DATA: Array<[string, string]> = [
	["account", "email, name"],
	["analytics", "device, ip"],
];
const POLICY_COOKIES: Array<[string, string]> = [
	["necessary", "session"],
	["analytics", "ga"],
	["marketing", "meta_pixel"],
];

function PolicyArticle() {
	return (
		<article className="space-y-7 p-6 md:p-8">
			<p className="text-[0.6875rem] tracking-wide text-mute uppercase">Home / Legal / Privacy</p>
			<header>
				<h3 className="text-2xl font-medium tracking-tight text-ink md:text-3xl">Privacy Policy</h3>
				<p className="mt-2 text-xs text-mute">
					Acme, Inc. · Last updated April 2026 · Effective May 2026
				</p>
			</header>
			<p className="text-sm leading-6 text-ink/80">
				We collect a small amount of data to keep your account working and to understand how the
				product is used. The categories below are the complete list — nothing else is stored or
				shared.
			</p>
			<PolicySection
				n="1"
				title="Information we collect"
				intro="The following data is associated with your account."
				rows={POLICY_DATA}
			/>
			<PolicySection
				n="2"
				title="Cookies and trackers"
				intro="We only set cookies in the categories you have accepted."
				rows={POLICY_COOKIES}
			/>
		</article>
	);
}

function PolicySection({
	n,
	title,
	intro,
	rows,
}: {
	n: string;
	title: string;
	intro: string;
	rows: Array<[string, string]>;
}) {
	return (
		<section>
			<h4 id={`section-${n}`} className="text-base font-medium tracking-tight text-ink">
				{n}. {title}
			</h4>
			<p className="mt-2 text-sm leading-6 text-ink/70">{intro}</p>
			<dl className="mt-4 grid grid-cols-[auto_1fr] gap-y-1 text-xs">
				{rows.map(([k, v]) => (
					<div key={k} className="contents">
						<dt className="pr-6 text-ink/60">{k}</dt>
						<dd className="text-ink">{v}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

function BrowserPreview() {
	return (
		<div className="flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-black/10 bg-[#ececec] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.18)]">
			<div className="flex shrink-0 items-center gap-3 border-b border-black/5 px-4 py-2.5">
				<div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
					<span className="size-3 rounded-full bg-[#ff5f57]" />
					<span className="size-3 rounded-full bg-[#febc2e]" />
					<span className="size-3 rounded-full bg-[#28c840]" />
				</div>
				<div
					aria-hidden="true"
					className="ml-2 hidden shrink-0 items-center gap-2 text-[#9a9a9a] sm:flex"
				>
					<CaretLeftIcon weight="bold" className="size-3.5" />
					<CaretRightIcon weight="bold" className="size-3.5" />
				</div>
				<div className="mx-auto flex w-full max-w-sm min-w-0 items-center gap-2 rounded-sm border border-black/5 bg-white px-3 py-1 text-xs text-[#3a3a3a] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
					<LockSimpleIcon weight="fill" aria-hidden="true" className="size-3 shrink-0" />
					<span className="truncate">
						<span className="text-[#9a9a9a]">https://</span>acme.com/privacy
					</span>
				</div>
				<div
					aria-hidden="true"
					className="hidden shrink-0 items-center gap-2 text-[#9a9a9a] sm:flex"
				>
					<ShareFatIcon weight="regular" className="size-3.5" />
					<PlusIcon weight="bold" className="size-3.5" />
				</div>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto bg-white">
				<PolicyArticle />
			</div>
		</div>
	);
}

function Thesis() {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<SectionMarker index="01" label="the thesis" />
				<div className="mt-16 grid gap-16 md:grid-cols-[1fr_1.4fr]">
					<h2 className="max-w-[20ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
						The consent ecosystem doesn’t fit modern apps.
					</h2>
					<div className="space-y-6 text-base text-pretty text-mute">
						<p>
							Today’s privacy story is heavy SaaS banners glued to hand-written legal pages. Nothing
							composes with your stack. Nothing is testable. Nothing speaks to AI agents.
						</p>
						<p>
							PolicyStack is built on the opposite premise: consent and policy are{" "}
							<Highlight>infrastructure</Highlight>. They belong in your repo, behind types, in your
							tests, and out of the way.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

function Products({ stars }: { stars: { consent: number | null; policy: number | null } }) {
	return (
		<section id="products" className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<SectionMarker index="02" label="three building blocks" />
				<h2 className="mt-16 max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Use one. Use <Highlight>all three.</Highlight>
				</h2>
				<p className="mt-8 max-w-[60ch] text-lg text-pretty text-mute">
					Each repo is independently useful and Apache-2.0 licensed. PolicyStack Cloud sits on top
					when you want a hosted control plane.
				</p>

				<dl className="mt-20 grid border-2 border-black md:grid-cols-3">
					<ProductCard
						to="/consent"
						n="01"
						slug="consent"
						title="A headless consent state machine."
						body="Sub-4kb core with adapters for React, Vue, Solid, Svelte, and Angular. A Vite plugin flags ungated cookies at dev time. Integrations for GA, Meta Pixel, and more."
						tag="@policystack/react/consent"
						stars={stars.consent}
					/>
					<ProductCard
						to="/policy"
						n="02"
						slug="policy"
						title="Your policy as a typed config."
						body="Define your privacy and cookie policy once in TypeScript. Render it as React components, or generate Markdown. Ships a shadcn-style consent banner."
						tag="@policystack/react"
						stars={stars.policy}
					/>
					<ProductCard
						to="/cloud"
						n="03"
						slug="cloud"
						title="The hosted control plane."
						body="Centralized policy versioning, audit trails, and consent analytics across every app in your stack. Optional. Plays nicely with the OSS pieces."
						tag="hosted · early access"
						stars={null}
					/>
				</dl>
			</div>
		</section>
	);
}

function ProductCard({
	to,
	n,
	slug,
	title,
	body,
	tag,
	stars,
}: {
	to: string;
	n: string;
	slug: string;
	title: string;
	body: string;
	tag: string;
	stars: number | null;
}) {
	return (
		<Link
			to={to}
			className="group flex flex-col justify-between gap-12 border-black p-10 not-last:border-b-2 max-md:not-last:border-b-2 md:not-last:border-r-2 md:not-last:border-b-0"
		>
			<div>
				<div className="flex items-center justify-between text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[{n}]</span>
					<StarBadge stars={stars} />
				</div>
				<p className="mt-8 text-xs tracking-wide text-mute uppercase">{slug}</p>
				<dt className="mt-3 text-xl font-medium tracking-tight text-balance">{title}</dt>
				<dd className="mt-5 text-sm text-pretty text-mute">{body}</dd>
			</div>
			<div className="flex items-center justify-between text-xs tracking-wide text-mute uppercase">
				<span>{tag}</span>
				<ArrowRightIcon
					weight="bold"
					aria-hidden="true"
					className="size-4 text-ink transition group-hover:translate-x-1"
				/>
			</div>
		</Link>
	);
}

function StarBadge({ stars }: { stars: number | null }) {
	if (stars === null) return <span aria-hidden="true" />;
	return (
		<span className="inline-flex items-center gap-1.5 tabular-nums text-ink">
			<StarIcon weight="fill" aria-hidden="true" className="size-3.5 text-amber-400" />
			<span>{formatStars(stars)}</span>
		</span>
	);
}

function formatStars(n: number) {
	if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
	return n.toString();
}

function ForAgents() {
	return (
		<section className="border-b-2 border-black bg-black text-white">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-white/60 uppercase">
					<span className="text-white">[03]</span>
					<span className="h-0.5 w-10 bg-white/40" aria-hidden="true" />
					<span>byproduct</span>
				</div>
				<div className="mt-16 grid gap-20 md:grid-cols-[1fr_1.2fr]">
					<div className="min-w-0">
						<h2 className="max-w-[22ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
							Good DX that agents love.
						</h2>
						<p className="mt-8 max-w-[55ch] text-pretty text-white/70">
							We didn’t design PolicyStack for AI. We designed it so a human could grep their
							policy, diff a consent rule in a PR, and trust that what’s rendered matches what’s
							tested.
						</p>
						<p className="mt-6 max-w-[55ch] text-pretty text-white/70">
							Claude reading the same typed config is just what falls out. The machine-readable
							surface isn’t the goal — it’s the receipt.
						</p>
					</div>
					<ClaudeTerminal />
				</div>
			</div>
		</section>
	);
}

function ClaudeTerminal() {
	return (
		<WindowFrame title="claude — acme-web">
			<div className="overflow-x-auto p-5 font-mono text-[0.8125rem] leading-6 text-white/90">
				<p className="flex items-baseline gap-2">
					<CaretRightIcon
						weight="bold"
						className="size-3 shrink-0 self-center text-white/40"
						aria-hidden="true"
					/>
					<span className="text-white">Add a cookie banner and privacy policy.</span>
				</p>
				<p className="mt-5 text-white/50">
					React + Vite detected. I’ll wire up{" "}
					<span className="text-white/80">@policystack/react/consent</span> for the banner and{" "}
					<span className="text-white/80">@policystack/react</span> for the policy page.
				</p>
				<div className="mt-5 space-y-3 text-[0.78125rem]">
					<TerminalStep
						command="pnpm add @policystack/core/consent @policystack/react/consent"
						result="added 2 packages in 1.4s"
					/>
					<TerminalStep
						command="pnpm dlx @policystack/cli init"
						result="created src/policystack.ts"
					/>
				</div>
				<p className="mt-5 text-white/60">
					<span className="text-emerald-400">●</span> Edit{" "}
					<span className="text-white/80">src/App.tsx</span>
				</p>
				<pre className="mt-2 border-l-2 border-emerald-400/40 pl-4 text-white/85">
					{`+ import { PolicyStackConsentProvider } from "@policystack/react/consent";
+ import { CookieBanner } from "./CookieBanner";
+
+ <PolicyStackConsentProvider config={cookieConfig}>
+   <App />
+   <CookieBanner />
+ </PolicyStackConsentProvider>`}
				</pre>
				<p className="mt-5 text-white/60">
					<span className="text-emerald-400">●</span> Write{" "}
					<span className="text-white/80">src/routes/privacy.tsx</span>
				</p>
				<p className="mt-4 text-white/70">
					Banner gates analytics on consent. <span className="text-white">/privacy</span> renders
					from <span className="text-white/80">policystack.ts</span>. Want me to fill in the data
					block next?
				</p>
				<p className="mt-3 flex items-center gap-2 text-white/40">
					<CaretRightIcon weight="bold" className="size-3 shrink-0" aria-hidden="true" />
					<span aria-hidden="true" className="inline-block h-4 w-2 animate-pulse bg-white/80" />
				</p>
			</div>
		</WindowFrame>
	);
}

function TerminalStep({ command, result }: { command: string; result: string }) {
	return (
		<div>
			<p className="flex items-baseline gap-2 text-white/85">
				<span aria-hidden="true" className="text-white/40">
					$
				</span>
				<span>{command}</span>
			</p>
			<p className="mt-1 pl-4 text-white/45">↳ {result}</p>
		</div>
	);
}

function Philosophy() {
	const items = [
		{
			n: "01",
			title: "Version-controlled",
			body: "Policies live next to your code. Changes go through PR review, not a vendor dashboard.",
		},
		{
			n: "02",
			title: "Testable",
			body: "Type-checked configs, snapshot tests for rendered policy, unit tests for consent state.",
		},
		{
			n: "03",
			title: "Composable",
			body: "Headless cores with framework adapters. Use the parts you want, swap the ones you don’t.",
		},
		{
			n: "04",
			title: "Tiny",
			body: "PolicyStack Consent core ships under 4kb gzipped. PolicyStack renders zero JS by default.",
		},
		{
			n: "05",
			title: "Open source",
			body: "Apache-2.0 across the board. PolicyStack Cloud is the only commercial piece, and it’s optional.",
		},
		{
			n: "06",
			title: "Honest",
			body: "It generates documents and manages state. It does not give legal advice.",
		},
	];
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<SectionMarker index="04" label="principles" />
				<h2 className="mt-16 max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Built like the rest of your stack.
				</h2>
				<dl className="mt-20 grid border-2 border-black md:grid-cols-3">
					{items.map((it) => (
						<div
							key={it.n}
							className={[
								"border-black p-10",
								"max-md:not-last:border-b-2",
								"md:not-nth-last-[-n+3]:border-b-2",
								"md:not-nth-[3n]:border-r-2",
							].join(" ")}
						>
							<div className="flex items-center justify-between text-xs tracking-wide text-mute uppercase">
								<span className="text-ink">[{it.n}]</span>
							</div>
							<dt className="mt-8 text-base font-medium tracking-tight text-ink">{it.title}</dt>
							<dd className="mt-3 text-sm text-pretty text-mute">{it.body}</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}

function CTA() {
	return (
		<section>
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<SectionMarker index="06" label="get started" />
				<div className="mt-16 grid gap-16 md:grid-cols-[1.2fr_1fr] md:items-end">
					<div>
						<h2 className="max-w-[22ch] text-4xl font-medium tracking-tight text-balance md:text-5xl">
							Stop pasting cookie banners. Start <Highlight>shipping.</Highlight>
						</h2>
						<p className="mt-8 max-w-[55ch] text-pretty text-mute">
							Pick a repo, install one package, and have a typed policy and a working consent flow
							before lunch.
						</p>
					</div>
					<div className="flex flex-col items-stretch gap-4 md:ml-auto md:w-64">
						<a
							href="https://policystack.dev/docs"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black"
						>
							<ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
							get started
						</a>
						<Link
							to="/cloud"
							className="inline-flex items-center justify-center border-2 border-black px-6 py-3.5 text-sm tracking-wide uppercase hover:bg-black hover:text-white"
						>
							join cloud
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
