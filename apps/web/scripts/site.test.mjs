import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { test } from "node:test";
import { parse } from "node-html-parser";
import matter from "gray-matter";
import { renderLlmsTxt } from "@policystack/sdk";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = resolve(root, "dist");
const read = (name) => readFileSync(resolve(dist, name), "utf8");
const json = (name) => JSON.parse(readFileSync(resolve(root, name), "utf8"));
const redirects = new Map(json("redirects.json").map(({ from, to }) => [from, to]));
const routes = json("scripts/legacy-routes.json");
const content = readdirSync(resolve(root, "content"), { recursive: true })
	.filter((file) => /\.mdx?$/.test(file))
	.map((file) => ({
		file,
		route: `/${file.replace(/\.mdx?$/, "").replace(/(^|\/)index$/, "")}`.replace(/\/$/, "") || "/",
		...matter(readFileSync(resolve(root, "content", file), "utf8")),
	}));
const htmlPath = (route) => `${route === "/" ? "" : route.slice(1) + "/"}index.html`;
const html = (route) => parse(read(htmlPath(route)));
const mirror = (route) => (route === "/" ? "index.md" : `${route.slice(1)}.md`);

function target(path) {
	if (redirects.has(path)) path = redirects.get(path);
	const direct = resolve(dist, `.${path}`);
	if (existsSync(direct) && statSync(direct).isFile()) return direct;
	const index = resolve(direct, "index.html");
	return existsSync(index) ? index : null;
}

test("all legacy pages and Markdown endpoints survive", () => {
	for (const route of routes) {
		assert.ok(target(route), route);
		assert.ok(existsSync(resolve(dist, mirror(route))), `${route}: missing Markdown`);
	}
	assert.equal(content.filter(({ data }) => data.type === "blog").length, 8);
	assert.equal(read("sdk.txt"), renderLlmsTxt());
});

test("blog index links every published post to its article", () => {
	const links = html("/blog").querySelectorAll("article h2 a");
	const posts = content.filter(({ data }) => data.type === "blog" && !data.draft);
	assert.equal(links.length, posts.length);
	for (const post of posts) {
		const link = links.find((node) => node.textContent === post.data.title);
		assert.equal(link?.getAttribute("href"), post.route, post.data.title);
		assert.ok(target(post.route), `${post.route}: missing article`);
	}
});

test("every current doc has a usable standalone Markdown mirror and SEO", () => {
	for (const page of content) {
		const body = read(mirror(page.route));
		assert.ok(page.data.title && page.data.description, `${page.file}: missing metadata`);
		assert.ok(body.includes(page.data.title), `${page.route}: missing title`);
		for (const [, example] of page.content.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)) {
			assert.ok(body.includes(example.trim()), `${page.route}: code changed in Markdown output`);
		}
		const document = html(page.route);
		assert.equal(document.querySelectorAll("h1").length, 1, `${page.route}: H1`);
		assert.equal(
			document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
			`https://policystack.dev${page.route === "/" ? "/" : page.route}`,
		);
		assert.ok(document.querySelector('meta[name="description"]')?.getAttribute("content"));
		const plain = body
			.replace(/^---\n[\s\S]*?\n---/, "")
			.replace(/```[\s\S]*?```/g, "")
			.replace(/`[^`]*`/g, "");
		assert.doesNotMatch(plain, /<(?:CardGroup|Card|Tabs|Tab|Steps|Step|Callout)\b/);
		assert.doesNotMatch(plain, /\]\(\/(?!\/)/, `${page.route}: relative Markdown links`);
		if (page.file.startsWith("docs/") && page.route !== "/docs/roadmap") {
			assert.match(body, /\bV1\b/, `${page.route}: missing version context`);
			assert.ok(read("llms.txt").includes(`https://policystack.dev${page.route}`));
		}
	}
});

test("V1 reference and roadmap cannot be confused in consolidated AI output", () => {
	const full = read("llms-full.txt");
	assert.ok(read("llms.txt").includes("Generated SDK reference"));
	assert.ok(read("llms.txt").includes("V2 roadmap — planned, not shipped"));
	assert.ok(full.includes("V1 support matrix and limitations"));
	assert.ok(!full.includes("## Delivery direction"), "Roadmap body leaked into current corpus");
	assert.ok(
		!full.includes("Historical article; examples reflect"),
		"Historical blog leaked into current corpus",
	);
	const manifest = JSON.parse(read("agent-readability.json"));
	assert.equal(manifest.artifacts.sdk, "https://policystack.dev/sdk.txt");
	assert.ok(!manifest.artifacts.mcp);
	assert.ok(
		!manifest.artifacts.markdown.contentNegotiation,
		"Static site must not advertise content negotiation",
	);
});

test("internal page links, images, and heading anchors resolve", () => {
	const errors = new Set();
	for (const route of new Set([...routes, ...content.map((page) => page.route)])) {
		const document = html(route);
		for (const link of document.querySelectorAll("a[href], img[src]")) {
			const href = link.getAttribute("href") ?? link.getAttribute("src");
			const url = new URL(href, `https://policystack.dev${route}`);
			if (url.origin !== "https://policystack.dev") continue;
			const file = target(decodeURI(url.pathname));
			if (!file) {
				errors.add(`${route} -> ${url.pathname}`);
				continue;
			}
			if (url.hash && file.endsWith(".html")) {
				const targetDoc = parse(readFileSync(file, "utf8"));
				const id = decodeURIComponent(url.hash.slice(1));
				if (!targetDoc.querySelectorAll("[id]").some((element) => element.id === id))
					errors.add(`${route} -> ${url.pathname}${url.hash}`);
			}
		}
	}
	assert.deepEqual([...errors], []);
});

test("deployment redirects, feeds, metadata, and crawler policy are present", () => {
	const deployment = json("vercel.json");
	for (const [from, to] of redirects) {
		assert.ok(target(to), `${from} -> ${to}`);
		assert.ok(
			deployment.redirects.some(
				(r) => r.source === from && r.destination === to && r.statusCode === 301,
			),
		);
		assert.ok(!redirects.has(to), `${from}: redirect chain`);
	}
	assert.match(read("blog/rss.xml"), /<item>/);
	for (const path of ["/", "/blog", "/privacy", "/docs/roadmap"]) {
		assert.ok(read("sitemap.xml").includes(`https://policystack.dev${path}`), path);
		const doc = html(path);
		assert.ok(doc.querySelector('script[type="application/ld+json"]'));
		const image = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
		assert.ok(image && target(new URL(image).pathname), `${path}: missing OG image`);
	}
	assert.doesNotMatch(read("robots.txt"), /Disallow:\s*\/\s*$/m);
});

test("tracking integrations are absent from rendered pages", () => {
	for (const route of routes) {
		const scripts = html(route)
			.querySelectorAll("script")
			.map((node) => node.toString())
			.join("\n");
		assert.doesNotMatch(scripts, /databuddy|offstage|pk_live_|831fa430/i);
	}
});

test("search contains answers for the fixed V1 discovery questions", () => {
	const index = JSON.parse(read("blume-search.json"));
	const cases = [
		["/docs/quickstart", /ConsentControls/, "Add cookie consent to React"],
		["/docs/policy/policies/quick-start", /compilePolicy/, "Generate a privacy policy"],
		["/docs/reference/support", /Angular 20/, "Which frameworks are supported?"],
		["/docs/consent/vite", /consent.*mode/s, "Detect ungated analytics with Vite"],
		["/docs/policy/cli", /scan_ungated/, "Connect CLI and MCP tools"],
		[
			"/docs/reference/support",
			/not shipped V1 capabilities/,
			"Which capabilities are planned for V2?",
		],
		["/docs/roadmap", /not a shipped capability/, "What is V2's status?"],
	];
	for (const [path, answer, question] of cases) {
		const record = index.find((entry) => entry.route === path);
		assert.ok(record, `${question}: missing ${path}`);
		assert.match(read(mirror(path)), answer, question);
	}
});
