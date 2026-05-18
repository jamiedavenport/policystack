import { allDocs, allPosts } from "content-collections";
import indexPage from "../../content/pages/index.md?raw";
import policyPage from "../../content/pages/policy.md?raw";
import consentPage from "../../content/pages/consent.md?raw";
import cloudPage from "../../content/pages/cloud.md?raw";

const SITE = "https://policystack.dev";

export const MARKDOWN_HEADERS = {
	"content-type": "text/markdown; charset=utf-8",
	"cache-control": "public, max-age=300, s-maxage=3600",
} as const;

export const PLAIN_HEADERS = {
	"content-type": "text/plain; charset=utf-8",
	"cache-control": "public, max-age=300, s-maxage=3600",
} as const;

export const MARKETING_PAGES = {
	index: indexPage,
	policy: policyPage,
	consent: consentPage,
	cloud: cloudPage,
} as const;

export function renderDoc(doc: { title: string; description?: string; content: string }) {
	const lines = [`# ${doc.title}`];
	if (doc.description) lines.push("", `> ${doc.description}`);
	lines.push("", doc.content.trim(), "");
	return lines.join("\n");
}

export function renderPost(post: {
	title: string;
	excerpt: string;
	date: string;
	tag: string;
	readingTime: string;
	content: string;
}) {
	return [
		`# ${post.title}`,
		"",
		`> ${post.excerpt}`,
		"",
		`*${post.date} · ${post.tag} · ${post.readingTime}*`,
		"",
		post.content.trim(),
		"",
	].join("\n");
}

export function renderBlogIndex() {
	const posts = [...allPosts].sort((a, b) => b.date.localeCompare(a.date));
	const lines = [
		"# Blog",
		"",
		"> Notes, releases, and engineering posts from the PolicyStack team.",
		"",
	];
	for (const post of posts) {
		lines.push(
			`- [${post.title}](${SITE}/blog/${post.slug}.md) — ${post.excerpt}`,
			`  *${post.date} · ${post.tag}*`,
		);
	}
	lines.push("");
	return lines.join("\n");
}

export function renderLlmsTxt() {
	const posts = [...allPosts].sort((a, b) => b.date.localeCompare(a.date));
	const indexDoc = allDocs.find((d) => d.slug === "index");
	const policyDocs = allDocs
		.filter((d) => d.product === "policy" || d.slug.startsWith("policy/"))
		.sort((a, b) => a.slug.localeCompare(b.slug));
	const consentDocs = allDocs
		.filter((d) => d.product === "consent" || d.slug.startsWith("consent/"))
		.sort((a, b) => a.slug.localeCompare(b.slug));

	const lines = [
		"# PolicyStack",
		"",
		"> Open-source primitives for privacy and consent. PolicyStack turns your privacy and cookie policy into a typed TypeScript config that renders as React components or Markdown. PolicyStack Consent is a sub-4kb headless cookie-consent state machine with adapters for React, Vue, Solid, Svelte, and Angular. PolicyStack Cloud is the hosted control plane on top — policy versioning, audit trails, and consent analytics.",
		"",
		"## Products",
		"",
		`- [PolicyStack](${SITE}/policy.md): TypeScript-defined privacy policies, rendered with framework-native components`,
		`- [PolicyStack Consent](${SITE}/consent.md): Sub-4kb headless cookie-consent state machine`,
		`- [PolicyStack Cloud](${SITE}/cloud.md): Hosted policy versioning and consent analytics (early access)`,
		"",
		"## SDK",
		"",
		`- [SDK reference (llms.txt)](${SITE}/sdk.txt): Type-generated \`@policystack/sdk\` API surface — feed it to a coding agent to produce a correct policystack.ts`,
		"",
		"## Documentation",
		"",
	];

	if (indexDoc) {
		lines.push(
			`- [Documentation home](${SITE}/docs.md): ${indexDoc.description ?? "Reference for PolicyStack and PolicyStack Consent"}`,
		);
	}
	lines.push("");

	if (policyDocs.length) {
		lines.push("### PolicyStack docs", "");
		for (const doc of policyDocs) lines.push(formatDocLink(doc));
		lines.push("");
	}
	if (consentDocs.length) {
		lines.push("### PolicyStack Consent docs", "");
		for (const doc of consentDocs) lines.push(formatDocLink(doc));
		lines.push("");
	}

	lines.push("## Blog", "");
	for (const post of posts) {
		lines.push(`- [${post.title}](${SITE}/blog/${post.slug}.md): ${post.excerpt}`);
	}
	lines.push("");

	lines.push(
		"## Optional",
		"",
		`- [Home](${SITE}/index.md): PolicyStack overview and links to the three products`,
		`- [Blog index](${SITE}/blog.md): All posts, newest first`,
		"",
	);

	return lines.join("\n");
}

function formatDocLink(doc: { title: string; description?: string; slug: string }) {
	const url = `${SITE}/docs/${doc.slug}.md`;
	return doc.description
		? `- [${doc.title}](${url}): ${doc.description}`
		: `- [${doc.title}](${url})`;
}
