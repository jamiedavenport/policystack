import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import shikiRehype from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import type { ThemeRegistrationRaw } from "shiki/core";
import { z } from "zod";

import monoTheme from "./src/lib/shiki-mono-theme.json" with { type: "json" };
import { parseChromeMeta, shikiChromeTransformer } from "./src/lib/rehype-codeblock-chrome";

const shikiPlugin: [typeof shikiRehype, Record<string, unknown>] = [
	shikiRehype,
	{
		theme: monoTheme as unknown as ThemeRegistrationRaw,
		langs: ["ts", "tsx", "json", "bash", "html", "css", "vue", "svelte", "astro"],
		// Fenced blocks with no language (e.g. CLI/validator output) and any
		// unrecognised language fall back to plaintext shiki markup instead of
		// being left unhighlighted — the latter makes the `code` mdx override
		// treat a block as inline code and apply the wrapping pill style.
		defaultLanguage: "text",
		fallbackLanguage: "text",
		parseMetaString: (metaString: string | null | undefined) => parseChromeMeta(metaString),
		transformers: [shikiChromeTransformer],
	},
];

const posts = defineCollection({
	name: "posts",
	directory: "content/blog",
	include: "*.mdx",
	schema: z.object({
		title: z.string(),
		excerpt: z.string(),
		date: z.string(),
		tag: z.enum(["thesis", "release", "AI", "engineering"]),
		author: z.string().default("Jamie Davenport"),
		upNext: z.string().optional(),
	}),
	transform: async (doc, ctx) => {
		const body = await compileMDX(ctx, doc, {
			remarkPlugins: [remarkGfm],
			rehypePlugins: [shikiPlugin],
		});
		const slug = doc._meta.fileName.replace(/\.mdx$/, "");
		const readingTime = computeReadingTime(doc.content);
		return { ...doc, slug, body, readingTime };
	},
});

const docs = defineCollection({
	name: "docs",
	directory: "content/docs",
	include: "**/*.md",
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		product: z.enum(["policy", "consent", "shared"]).optional(),
	}),
	transform: async (doc, ctx) => {
		const body = await compileMDX(ctx, doc, {
			remarkPlugins: [remarkGfm],
			rehypePlugins: [
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: "append",
						properties: {
							className: ["heading-anchor"],
							ariaLabel: "Link to section",
						},
						content: { type: "text", value: "#" },
					},
				],
				shikiPlugin,
			],
		});
		const slug = doc._meta.path;
		const headings = extractHeadings(doc.content);
		return { ...doc, slug, body, headings };
	},
});

export default defineConfig({ content: [posts, docs] });

function extractHeadings(content: string): Array<{
	depth: 2 | 3;
	value: string;
	id: string;
}> {
	const headings: Array<{ depth: 2 | 3; value: string; id: string }> = [];
	const lines = content.split("\n");
	let inFence = false;
	for (const line of lines) {
		if (line.startsWith("```")) {
			inFence = !inFence;
			continue;
		}
		if (inFence) continue;
		const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
		if (!m) continue;
		const depth = (m[1].length === 2 ? 2 : 3) as 2 | 3;
		const value = m[2].replace(/`([^`]+)`/g, "$1").trim();
		const id = slugify(value);
		headings.push({ depth, value, id });
	}
	return headings;
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-");
}

function computeReadingTime(content: string): string {
	const prose = content
		.replace(/```[\s\S]*?```/g, "")
		.replace(/`[^`]*`/g, "")
		.replace(/<[^>]+>/g, "")
		.replace(/[#>*_\-[\]()!]/g, " ");
	const words = prose.trim().split(/\s+/).filter(Boolean).length;
	const minutes = Math.max(1, Math.ceil(words / 200));
	return `${minutes} min`;
}
