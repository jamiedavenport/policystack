import { defineOgConfig, ignore, type OgConfig } from "@jxdltd/tanstack/og";
import { allDocs, allPosts } from "content-collections";

const config = {
	"/": () => ({
		title: "Privacy and consent primitives for developers.",
		description: "policystack.dev",
		type: "website",
	}),

	"/blog": () => ({
		title: "Notes from building PolicyStack.",
		description: "policystack.dev/blog",
		type: "website",
		eyebrow: "BLOG",
	}),

	"/consent": () => ({
		title: "A headless consent state machine.",
		description: "policystack.dev/consent",
		type: "website",
		eyebrow: "OPENCOOKIES",
	}),

	"/policy": () => ({
		title: "Your privacy policy as a typed config.",
		description: "policystack.dev/policy",
		type: "website",
		eyebrow: "POLICYSTACK",
	}),

	"/cloud": () => ({
		title: "The hosted control plane for your policies.",
		description: "policystack.dev/cloud",
		type: "website",
		eyebrow: "POLICYCLOUD",
	}),

	"/docs": () => ({
		title: "PolicyStack and PolicyStack Consent documentation.",
		description: "policystack.dev/docs",
		type: "website",
		eyebrow: "DOCS",
	}),

	// Docs use a splat catch-all (`/docs/$`). The URL path is `/docs/<splat>`,
	// so we look the doc up by its slug to drive the OG card title/eyebrow.
	"/docs/$": ({ params }: { params: { _splat?: string } }) => {
		const splat = params._splat ?? "";
		const doc = allDocs.find((d) => d.slug === splat);
		if (!doc) return ignore;
		const eyebrow =
			doc.product === "policy"
				? "POLICYSTACK DOCS"
				: doc.product === "consent"
					? "OPENCOOKIES DOCS"
					: "DOCS";
		return {
			title: doc.title,
			description: doc.description ?? `policystack.dev/docs/${splat}`,
			type: "website" as const,
			eyebrow,
		};
	},

	// The OG handler matches against URL paths. Flat-file route
	// `blog_.$slug.tsx` produces route id `/blog_/$slug` (which is what
	// `FileRoutesByPath` exposes), but the URL is `/blog/$slug` — so we key
	// on the URL path and cast.
	"/blog/$slug": ({ params }: { params: { slug: string } }) => {
		const post = allPosts.find((p) => p.slug === params.slug);
		if (!post) return ignore;
		return {
			title: post.title,
			type: "article" as const,
			tag: post.tag,
			author: post.author,
			date: post.date,
			readingTime: post.readingTime,
		};
	},

	"/og/$": () => ignore,
} as unknown as OgConfig;

export default defineOgConfig(config);
