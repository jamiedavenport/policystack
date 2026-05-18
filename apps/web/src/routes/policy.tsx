import type { ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { CodeBlock } from "../components/CodeBlock";
import { Highlight } from "../components/Highlight";
import { Sponsor } from "../components/Sponsor";
import { highlight } from "../lib/shiki";
import { pageMeta } from "../lib/seo";

const HERO_SNIPPET = `import { PolicyStack, PrivacyPolicy } from "@policystack/react";
import policy from "@/policystack";

export function PrivacyPolicyPage() {
  return (
    <PolicyStack config={policy}>
      <PrivacyPolicy />
    </PolicyStack>
  );
}`;

const INSTALL_SNIPPET = `pnpm dlx @policystack/cli init`;

const USE_SNIPPET = `import { defineConfig } from "@policystack/sdk";

export default defineConfig({
  company: { name: "Acme, Inc." },
  jurisdictions: ["eu", "us-ca"],
  data: {
    collected: {
      "Account Information": ["Name", "Email"],
    },
  },
});`;

type ComparisonRow = {
	feature: string;
	policy: string;
	lawyers: string;
	templates: string;
	termly: string;
	iubenda: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
	{
		feature: "Developer workflow (Git, TypeScript, CI)",
		policy: "✓",
		lawyers: "✗",
		templates: "✗",
		termly: "✗",
		iubenda: "✗",
	},
	{
		feature: "Version controlled",
		policy: "✓",
		lawyers: "✗",
		templates: "✗",
		termly: "✗",
		iubenda: "✗",
	},
	{
		feature: "Renders as a React / Vue / Svelte component",
		policy: "✓",
		lawyers: "✗",
		templates: "✗",
		termly: "✗",
		iubenda: "✗",
	},
	{
		feature: "Always in sync with the codebase",
		policy: "✓",
		lawyers: "✗",
		templates: "✗",
		termly: "✗",
		iubenda: "✗",
	},
	{
		feature: "Markdown / HTML / PDF output",
		policy: "✓",
		lawyers: "PDF only",
		templates: "Word / PDF",
		termly: "Hosted page",
		iubenda: "Hosted widget",
	},
	{
		feature: "GDPR + CCPA coverage",
		policy: "✓",
		lawyers: "✓",
		templates: "Varies",
		termly: "✓",
		iubenda: "✓",
	},
	{
		feature: "No ongoing subscription",
		policy: "✓",
		lawyers: "✗",
		templates: "✓",
		termly: "✗",
		iubenda: "✗",
	},
	{
		feature: "Self-hostable / open source",
		policy: "✓",
		lawyers: "—",
		templates: "—",
		termly: "✗",
		iubenda: "✗",
	},
];

export const Route = createFileRoute("/policy")({
	component: PolicyStack,
	head: (ctx) =>
		pageMeta(
			{
				title: "PolicyStack — your privacy policy as a typed config | PolicyStack",
				description:
					"Define your privacy and cookie policy once in TypeScript. Render it as React components, generate Markdown, ship a consent banner — all from one source of truth.",
				path: "/policy",
			},
			ctx,
		),
	loader: async () => {
		const [heroHtml, installHtml, useHtml] = await highlight({
			data: {
				items: [
					{ code: HERO_SNIPPET, lang: "tsx" },
					{ code: INSTALL_SNIPPET, lang: "bash" },
					{ code: USE_SNIPPET, lang: "ts" },
				],
			},
		});
		return { heroHtml, installHtml, useHtml };
	},
});

function PolicyStack() {
	const { heroHtml, installHtml, useHtml } = Route.useLoaderData();
	return (
		<>
			<ProductHero
				slug="policy"
				version="@policystack/react@0.0.30"
				title={
					<>
						Your privacy policy, <Highlight>as a typed config.</Highlight>
					</>
				}
				body="Define your policy once in TypeScript. Render it as React components, generate Markdown, ship a consent banner — all driven from the same source of truth."
				primary={{ label: "pnpm dlx @policystack/cli init", href: "#install", icon: "arrow-right" }}
				secondary={{
					label: "github",
					href: "https://github.com/jamiedavenport/policystack",
					icon: "arrow-up-right",
				}}
				snippetFile="privacy.tsx"
				html={heroHtml}
			/>

			<FeatureGrid
				index="01"
				eyebrow="what you get"
				title={
					<>
						A policy you can <Highlight>grep, diff, and review.</Highlight>
					</>
				}
				features={[
					{
						n: "01",
						title: "Typed config",
						body: "definePolicy() gives you autocomplete and type errors when something is missing or stale.",
					},
					{
						n: "02",
						title: "React renderer",
						body: "Drop-in components for the policy page, individual sections, and per-purpose data tables.",
					},
					{
						n: "03",
						title: "Markdown export",
						body: "Generate a static .md version for your repo, your docs site, or for the agents to consume.",
					},
					{
						n: "04",
						title: "Consent banner",
						body: "A shadcn-style banner that reads from the same config — no copy drift between policy and UI.",
					},
					{
						n: "05",
						title: "Astro + Svelte",
						body: "Astro docs are first-class. A Svelte adapter is shipping. More frameworks on the roadmap.",
					},
					{
						n: "06",
						title: "Documents, not advice",
						body: "Built with privacy counsel review in mind — never as a replacement for it.",
					},
				]}
			/>

			<Comparison index="02" rows={COMPARISON_ROWS} />

			<Install
				id="install"
				index="03"
				commands={[
					{ tag: "bash", html: installHtml },
					{ tag: "policystack.ts", html: useHtml },
				]}
				next={{ to: "/consent", label: "Pair it with PolicyStack Consent for consent state" }}
			/>

			<Sponsor index="04" />
		</>
	);
}

type HeroAction = {
	label: string;
	href: string;
	icon: "arrow-right" | "arrow-up-right";
};

function HeroIcon({ icon }: { icon: HeroAction["icon"] }) {
	const Icon = icon === "arrow-right" ? ArrowRightIcon : ArrowUpRightIcon;
	return <Icon weight="bold" className="size-4 shrink-0" aria-hidden="true" />;
}

export function ProductHero({
	slug,
	version,
	title,
	body,
	primary,
	secondary,
	snippetFile,
	html,
}: {
	slug: string;
	version: string;
	title: ReactNode;
	body: string;
	primary: HeroAction;
	secondary: HeroAction;
	snippetFile: string;
	html: string;
}) {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 pt-28 pb-32 md:pt-36 md:pb-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[{slug}]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>{version}</span>
				</div>

				<div className="mt-16 grid gap-16 md:grid-cols-2 md:items-start">
					<div>
						<h1 className="max-w-[20ch] text-4xl font-medium tracking-tight text-balance md:text-6xl">
							{title}
						</h1>
						<p className="mt-10 max-w-[55ch] text-lg text-pretty text-mute">{body}</p>
						<div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
							<a
								href={primary.href}
								className="inline-flex items-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black"
							>
								<HeroIcon icon={primary.icon} />
								{primary.label}
							</a>
							<a
								href={secondary.href}
								target={secondary.icon === "arrow-up-right" ? "_blank" : undefined}
								rel={secondary.icon === "arrow-up-right" ? "noopener noreferrer" : undefined}
								className="inline-flex items-center gap-2.5 border-2 border-black px-6 py-3.5 text-sm tracking-wide uppercase hover:bg-black hover:text-white"
							>
								{secondary.label}
								<HeroIcon icon={secondary.icon} />
							</a>
						</div>
					</div>
					<CodeBlock file={snippetFile} html={html} />
				</div>
			</div>
		</section>
	);
}

export function FeatureGrid({
	index,
	eyebrow,
	title,
	features,
}: {
	index: string;
	eyebrow: string;
	title: ReactNode;
	features: Array<{ n: string; title: string; body: string }>;
}) {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[{index}]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>{eyebrow}</span>
				</div>
				<h2 className="mt-12 max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					{title}
				</h2>
				<dl className="mt-20 grid border-2 border-black md:grid-cols-3">
					{features.map((f) => (
						<div
							key={f.n}
							className={[
								"border-black p-10",
								"max-md:not-last:border-b-2",
								"md:not-nth-last-[-n+3]:border-b-2",
								"md:not-nth-[3n]:border-r-2",
							].join(" ")}
						>
							<span className="text-xs tracking-wide text-ink uppercase">[{f.n}]</span>
							<dt className="mt-8 text-base font-medium tracking-tight text-ink">{f.title}</dt>
							<dd className="mt-3 text-sm text-pretty text-mute">{f.body}</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}

function Comparison({ index, rows }: { index: string; rows: ComparisonRow[] }) {
	const competitors = ["lawyers", "templates", "termly", "iubenda"] as const;
	const labels: Record<(typeof competitors)[number], string> = {
		lawyers: "Lawyers",
		templates: "Templates",
		termly: "Termly",
		iubenda: "iubenda",
	};

	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[{index}]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>vs the alternatives</span>
				</div>
				<h2 className="mt-12 max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Not a SaaS dashboard. Not a <Highlight>static template.</Highlight>
				</h2>
				<p className="mt-8 max-w-[60ch] text-lg text-pretty text-mute">
					Same legal coverage you’d get from a lawyer, a template, or one of the incumbent SaaS
					tools — without the invoice, the dashboard, or the drift.
				</p>

				<div className="mt-16 overflow-x-auto border-2 border-black">
					<table className="w-full min-w-[44rem] border-collapse">
						<thead>
							<tr className="border-b-2 border-black bg-ink/4 text-left">
								<th className="px-5 py-4 text-xs font-medium tracking-wide text-ink uppercase">
									Feature
								</th>
								<th className="border-l-2 border-black bg-yellow-300/30 px-5 py-4 text-xs font-medium tracking-wide text-ink uppercase">
									PolicyStack
								</th>
								{competitors.map((c) => (
									<th
										key={c}
										className="px-5 py-4 text-xs font-medium tracking-wide text-mute uppercase"
									>
										{labels[c]}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.feature} className="not-last:border-b not-last:border-black/15">
									<th
										scope="row"
										className="px-5 py-4 text-left text-sm font-normal text-pretty text-ink"
									>
										{row.feature}
									</th>
									<td className="border-l-2 border-black bg-yellow-300/15 px-5 py-4 align-top text-sm font-medium text-ink">
										<ComparisonValue value={row.policy} />
									</td>
									{competitors.map((c) => (
										<td key={c} className="px-5 py-4 align-top text-sm text-mute">
											<ComparisonValue value={row[c]} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<p className="mt-10 max-w-[60ch] text-sm text-pretty text-mute">
					GDPR and CCPA coverage is the floor — PolicyStack is not legal advice and is not a
					replacement for counsel on high-stakes matters.
				</p>
			</div>
		</section>
	);
}

function ComparisonValue({ value }: { value: string }) {
	if (value === "✓") {
		return <CheckIcon weight="bold" aria-label="Yes" className="size-4 text-ink" />;
	}
	if (value === "✗") {
		return <XIcon weight="bold" aria-label="No" className="size-4 text-mute" />;
	}
	return <span>{value}</span>;
}

export function Install({
	id,
	index,
	commands,
	next,
}: {
	id?: string;
	index: string;
	commands: Array<{ tag: string; html: string }>;
	next?: { to: string; label: string };
}) {
	return (
		<section id={id} className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[{index}]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>install</span>
				</div>
				<h2 className="mt-12 max-w-[24ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Two lines and you’re <Highlight>shipping.</Highlight>
				</h2>
				<div className="mt-16 grid gap-8 md:grid-cols-2">
					{commands.map((c) => (
						<CodeBlock key={c.tag} file={c.tag} html={c.html} />
					))}
				</div>
				{next && (
					<div className="mt-16">
						<Link
							to={next.to}
							className="inline-flex items-center gap-2.5 border-2 border-black px-6 py-3.5 text-sm tracking-wide uppercase hover:bg-black hover:text-white"
						>
							<ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
							{next.label}
						</Link>
					</div>
				)}
			</div>
		</section>
	);
}
