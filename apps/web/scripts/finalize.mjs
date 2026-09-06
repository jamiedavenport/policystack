import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

process.chdir(fileURLToPath(new URL("..", import.meta.url)));
const site = "https://policystack.dev";
const posts = await Promise.all(
	(await readdir("content/blog"))
		.filter((name) => name.endsWith(".mdx"))
		.map(async (name) => {
			const { data } = matter(await readFile(`content/blog/${name}`, "utf8"));
			return { ...data, slug: name.replace(/\.mdx$/, "") };
		}),
);
posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
await writeFile(
	"dist/blog.md",
	`# PolicyStack blog\n\nHistorical articles. Use [current V1 documentation](${site}/docs.md) for supported APIs.\n\n${posts.map((post) => `- [${post.title}](${site}/blog/${post.slug}.md) — ${post.description}`).join("\n")}\n`,
);

// Blume 1.5.3 predates ai.llmsTxt.details. Extend its generated index, retaining
// native navigation and version handling instead of maintaining a second index.
const intro = `## Using PolicyStack V1

Use PolicyStack for TypeScript-defined privacy and cookie policies and headless consent. The current public package line is V1. Install with \`pnpm dlx @policystack/cli@1 init\` and review the generated configuration.

- [Complete React quickstart](${site}/docs/quickstart.md)
- [Current support and limitations](${site}/docs/reference/support.md)
- [Generated SDK reference](${site}/sdk.txt)
- [CLI and MCP tools](${site}/docs/policy/cli.md)
- [Generated agent workflow skills](${site}/docs/policy/agent-skills.md)
- [V2 roadmap — planned, not shipped](${site}/docs/roadmap.md)

Current V1 documentation is authoritative for supported APIs. The roadmap describes unshipped direction and historical blog posts describe their publication date. Neither is included in the consolidated current reference.

`;
let index = await readFile("dist/llms.txt", "utf8");
const firstSection = index.indexOf("\n## ");
if (firstSection < 0) throw new Error("Blume LLM index has no navigation sections");
index = index.slice(0, firstSection + 1) + intro + index.slice(firstSection + 1);
await writeFile("dist/llms.txt", index);
const manifest = JSON.parse(await readFile("dist/agent-readability.json", "utf8"));
manifest.artifacts.sdk = `${site}/sdk.txt`;
await writeFile("dist/agent-readability.json", JSON.stringify(manifest, null, 2) + "\n");

// Standalone mirrors must be useful when fetched without the original page URL.
for (const name of await readdir("dist", { recursive: true })) {
	if (!name.endsWith(".md") && name !== "llms-full.txt") continue;
	const file = `dist/${name}`;
	if (!(await stat(file)).isFile()) continue;
	const body = await readFile(file, "utf8");
	await writeFile(
		file,
		body
			.split(/(```[\s\S]*?```|`[^`]*`)/g)
			.map((part, index) => (index % 2 ? part : part.replace(/\]\(\/(?!\/)/g, `](${site}/`)))
			.join(""),
	);
}

// Deployment previews must not compete with production in search results.
if (process.env.VERCEL_ENV === "preview") {
	await writeFile("dist/robots.txt", "User-agent: *\nDisallow: /\n");
	for (const name of await readdir("dist", { recursive: true })) {
		if (!name.endsWith(".html")) continue;
		const file = `dist/${name}`;
		const body = (await readFile(file, "utf8")).replace(/<meta\s+name="robots"[^>]*>/g, "");
		await writeFile(
			file,
			body.replace("</head>", '<meta name="robots" content="noindex, nofollow"></head>'),
		);
	}
}
