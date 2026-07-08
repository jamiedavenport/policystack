import { createFileRoute } from "@tanstack/react-router";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { Highlight } from "../components/Highlight";
import { pageMeta } from "../lib/seo";

export const Route = createFileRoute("/cloud")({
	component: CloudPage,
	head: (ctx) =>
		pageMeta(
			{
				title: "Cloud — the hosted control plane for your policies | PolicyStack",
				description:
					"Centralized policy versioning, audit trails, and consent analytics across every app in your stack. The hosted control plane on top of Policy and Consent.",
				path: "/cloud",
			},
			ctx,
		),
});

function CloudPage() {
	return (
		<>
			<Hero />
			<Capabilities />
			<Pricing />
			<Waitlist />
		</>
	);
}

function Hero() {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 pt-28 pb-32 md:pt-36 md:pb-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[cloud]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>early access</span>
				</div>

				<h1 className="mt-16 max-w-[20ch] text-4xl font-medium tracking-tight text-balance md:text-7xl">
					The <Highlight>control plane</Highlight> for your policies.
				</h1>
				<p className="mt-12 max-w-[60ch] text-lg text-pretty text-mute">
					Centralized versioning, audit trails, and consent analytics across every app in your stack
					— without giving up the typed configs and headless primitives you already use.
				</p>
				<div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-4">
					<a
						href="https://cal.eu/jamie-openpolicy/openpolicy-chat-demo"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black"
					>
						<ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
						Book a demo
					</a>
				</div>

				<div className="mt-24 border-2 border-black">
					<div className="flex items-center justify-between border-b-2 border-black px-6 py-4 text-xs tracking-wide text-mute uppercase">
						<span>cloud · acme-prod</span>
						<span className="text-ink">healthy</span>
					</div>
					<div className="grid md:grid-cols-3">
						<Stat label="active policy" value="v2026.04-1" hint="Published 6d ago" first />
						<Stat label="consent rate (7d)" value="62.4%" hint="+2.1pp w/w" middle />
						<Stat label="open violations" value="0" hint="Last build" />
					</div>
				</div>
			</div>
		</section>
	);
}

function Stat({
	label,
	value,
	hint,
	first,
	middle,
}: {
	label: string;
	value: string;
	hint: string;
	first?: boolean;
	middle?: boolean;
}) {
	return (
		<div
			className={[
				"p-10",
				first || middle ? "md:border-r-2 md:border-black" : "",
				"max-md:not-last:border-b-2 max-md:border-black",
			].join(" ")}
		>
			<p className="text-xs tracking-wide text-mute uppercase">{label}</p>
			<p className="mt-6 text-3xl font-medium tabular-nums tracking-tight text-ink">{value}</p>
			<p className="mt-3 text-sm text-mute">{hint}</p>
		</div>
	);
}

function Capabilities() {
	const items = [
		{
			n: "01",
			title: "Policy registry",
			body: "Every published policy version, signed and timestamped. Diff between versions, see who approved what, roll back if you have to.",
		},
		{
			n: "02",
			title: "Consent analytics",
			body: "Acceptance rates by category, region, and surface. Funnel views to find the banner copy that actually works.",
		},
		{
			n: "03",
			title: "Cross-app config",
			body: "One source of truth for policies that span web, mobile, and backend services. SDKs pull the latest at boot, cached at the edge.",
		},
		{
			n: "04",
			title: "Audit log",
			body: "Every consent decision, every policy publish, every config change — exportable as JSONL for your compliance team.",
		},
		{
			n: "05",
			title: "DSAR inbox",
			body: "A simple intake for data subject requests, routed to whichever service holds the data, with a clock counting down to your SLA.",
		},
		{
			n: "06",
			title: "SSO + SAML",
			body: "SCIM provisioning, role-based access, IP allowlisting. The boring enterprise checklist, on by default.",
		},
	];
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[01]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>capabilities</span>
				</div>
				<h2 className="mt-12 max-w-[28ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					What Cloud adds <Highlight>on top.</Highlight>
				</h2>
				<p className="mt-8 max-w-[60ch] text-lg text-pretty text-mute">
					The open-source pieces are still doing the work. Cloud is the place to see them, version
					them, and prove what happened.
				</p>

				<dl className="mt-20 grid border-2 border-black md:grid-cols-2">
					{items.map((it, i) => (
						<div
							key={it.n}
							className={[
								"border-black p-10",
								"max-md:not-last:border-b-2",
								"md:not-nth-last-[-n+2]:border-b-2",
								"md:nth-[odd]:border-r-2",
								i === items.length - 1 ? "border-b-0" : "",
							].join(" ")}
						>
							<span className="text-xs tracking-wide text-ink uppercase">[{it.n}]</span>
							<dt className="mt-8 text-lg font-medium tracking-tight text-ink">{it.title}</dt>
							<dd className="mt-3 text-pretty text-mute">{it.body}</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}

function Pricing() {
	return (
		<section className="border-b-2 border-black">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[02]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>pricing</span>
				</div>
				<h2 className="mt-12 max-w-[24ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Pricing, <Highlight>when we’re ready.</Highlight>
				</h2>
				<p className="mt-8 max-w-[55ch] text-pretty text-mute">
					We’re in private beta with a handful of design partners. Pricing will be usage-based and
					boring. Open source stays open source.
				</p>

				<div className="mt-20 grid border-2 border-black md:grid-cols-3">
					<Tier
						name="open source"
						price="$0"
						blurb="Self-hosted. Apache-2.0. Yours forever."
						features={["Policy", "Consent", "Vite plugin", "CLI"]}
						position="first"
					/>
					<Tier
						name="cloud"
						price="usage"
						blurb="The hosted control plane, billed on consents and policy publishes."
						features={["Policy registry", "Consent analytics", "Cross-app config", "Audit log"]}
						highlight
						position="middle"
					/>
					<Tier
						name="enterprise"
						price="talk to us"
						blurb="For teams with procurement, security questionnaires, and a DPA."
						features={["SSO + SCIM", "Custom retention", "Region pinning", "Support SLA"]}
						position="last"
					/>
				</div>
			</div>
		</section>
	);
}

function Tier({
	name,
	price,
	blurb,
	features,
	highlight,
	position,
}: {
	name: string;
	price: string;
	blurb: string;
	features: string[];
	highlight?: boolean;
	position: "first" | "middle" | "last";
}) {
	return (
		<div
			className={[
				"flex flex-col p-10",
				position !== "last" ? "md:border-r-2 md:border-black" : "",
				position !== "last" ? "max-md:border-b-2 max-md:border-black" : "",
				highlight ? "bg-black text-white" : "",
			].join(" ")}
		>
			<div className="flex items-baseline justify-between">
				<h3 className={`text-xs tracking-wide uppercase ${highlight ? "text-white" : "text-ink"}`}>
					{name}
				</h3>
				<p className={`text-sm ${highlight ? "text-white/70" : "text-mute"}`}>{price}</p>
			</div>
			<p
				className={`mt-10 text-lg font-medium tracking-tight text-pretty ${highlight ? "text-white" : "text-ink"}`}
			>
				{blurb}
			</p>
			<ul role="list" className="mt-10 space-y-3 text-sm">
				{features.map((f) => (
					<li
						key={f}
						className={`flex items-start gap-2.5 ${highlight ? "text-white/80" : "text-mute"}`}
					>
						<CheckIcon
							weight="bold"
							aria-hidden="true"
							className={`size-4 h-lh shrink-0 ${highlight ? "text-white" : "text-ink"}`}
						/>
						<span>{f}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function Waitlist() {
	return (
		<section id="waitlist">
			<div className="mx-auto max-w-6xl px-8 py-32 md:py-40">
				<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
					<span className="text-ink">[03]</span>
					<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
					<span>early access</span>
				</div>
				<div className="mt-16 grid gap-16 md:grid-cols-[1fr_1fr] md:items-end">
					<div>
						<h2 className="max-w-[22ch] text-3xl font-medium tracking-tight text-balance md:text-4xl">
							See Cloud <Highlight>in action.</Highlight>
						</h2>
						<p className="mt-8 max-w-[50ch] text-pretty text-mute">
							We’re onboarding design partners through Q3 2026. Book a 30-minute call and we’ll walk
							you through the control plane.
						</p>
					</div>
					<div className="md:ml-auto md:w-72">
						<a
							href="https://cal.eu/jamie-openpolicy/openpolicy-chat-demo"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex w-full items-center justify-center gap-2.5 border-2 border-black bg-black px-6 py-3.5 text-sm tracking-wide text-white uppercase hover:bg-white hover:text-black"
						>
							<ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
							Book a demo
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
