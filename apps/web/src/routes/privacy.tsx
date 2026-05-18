import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicy, type PolicyComponents } from "@policystack/react/policy";
import openpolicy from "../policystack";
import { Highlight } from "../components/Highlight";
import { pageMeta } from "../lib/seo";

export const Route = createFileRoute("/privacy")({
	component: Privacy,
	head: (ctx) =>
		pageMeta(
			{
				title: "Privacy Policy — PolicyStack",
				description:
					"How PolicyStack collects, uses, and protects your data. Rendered from a typed config with PolicyStack.",
				path: "/privacy",
			},
			ctx,
		),
});

const policyComponents: PolicyComponents = {
	Root: ({ children }) => (
		<div className="space-y-6 text-base leading-7 text-pretty text-ink">{children}</div>
	),
	Section: ({ node, children }) => (
		<section id={node.id} className="space-y-4">
			{children}
		</section>
	),
	Heading: ({ node }) => {
		const level = node.level ?? 2;
		if (level <= 2) {
			return (
				<h2 className="scroll-mt-28 pt-10 text-2xl font-medium tracking-tight text-ink">
					{node.value}
				</h2>
			);
		}
		if (level === 3) {
			return (
				<h3 className="scroll-mt-28 pt-6 text-xl font-medium tracking-tight text-ink">
					{node.value}
				</h3>
			);
		}
		return (
			<h4 className="scroll-mt-28 pt-4 text-base font-medium tracking-tight text-ink uppercase">
				{node.value}
			</h4>
		);
	},
	Paragraph: ({ children }) => <p>{children}</p>,
	List: ({ node, children }) => {
		if (node.ordered) {
			return <ol className="list-decimal space-y-2 pl-6 marker:text-mute">{children}</ol>;
		}
		return <ul className="list-disc space-y-2 pl-6 marker:text-mute">{children}</ul>;
	},
	ListItem: ({ children }) => <li>{children}</li>,
	Link: ({ node }) => (
		<a
			href={node.href}
			className="underline decoration-mute underline-offset-4 hover:decoration-ink"
		>
			{node.value}
		</a>
	),
	Table: ({ children }) => (
		<div className="overflow-x-auto border-2 border-black">
			<table className="w-full border-collapse text-sm">{children}</table>
		</div>
	),
	TableHeaderRow: ({ children }) => (
		<thead className="border-b-2 border-black bg-ink/4 text-left text-xs tracking-wide text-ink uppercase">
			<tr>{children}</tr>
		</thead>
	),
	TableRow: ({ children }) => <tr>{children}</tr>,
	TableHeaderCell: ({ children }) => <th className="px-4 py-3 font-medium">{children}</th>,
	TableCell: ({ children }) => (
		<td className="border-t border-black/15 px-4 py-3 align-top text-ink">{children}</td>
	),
};

function Privacy() {
	return (
		<>
			<section className="border-b-2 border-black">
				<div className="mx-auto max-w-6xl px-8 pt-28 pb-20 md:pt-36 md:pb-24">
					<div className="flex items-center gap-4 text-xs tracking-wide text-mute uppercase">
						<span className="text-ink">[privacy]</span>
						<span className="h-0.5 w-10 bg-black" aria-hidden="true" />
						<span>policy as code</span>
					</div>
					<h1 className="mt-12 max-w-[24ch] text-4xl font-medium tracking-tight text-balance md:text-6xl">
						Privacy <Highlight>policy.</Highlight>
					</h1>
					<p className="mt-10 max-w-[60ch] text-lg text-pretty text-mute">
						This page is rendered at build time from a TypeScript config using PolicyStack. The same
						source of truth ships with the rest of the site, version-controlled and reviewable in
						pull requests.
					</p>
				</div>
			</section>

			<section>
				<div className="mx-auto max-w-6xl px-8 py-16 md:py-24">
					<article className="max-w-[72ch]">
						<PrivacyPolicy config={openpolicy} components={policyComponents} />
					</article>
				</div>
			</section>
		</>
	);
}
