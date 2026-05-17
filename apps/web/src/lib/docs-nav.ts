export type DocsLink = {
	type: "link";
	slug: string;
	title: string;
};

export type DocsSubsection = {
	type: "subsection";
	label: string;
};

export type DocsItem = DocsLink | DocsSubsection;

export type DocsGroup = {
	index: string;
	label: string;
	rootSlug: string;
	items: DocsItem[];
};

export const docsNav: DocsGroup[] = [
	{
		index: "00",
		label: "OpenPolicy",
		rootSlug: "openpolicy",
		items: [
			{ type: "link", slug: "openpolicy", title: "Introduction" },
			{ type: "link", slug: "openpolicy/cli", title: "CLI" },
			{ type: "link", slug: "openpolicy/agent-skills", title: "AI skill pack" },
			{ type: "link", slug: "openpolicy/configuration", title: "Configuration" },
			{ type: "link", slug: "openpolicy/i18n", title: "Internationalization" },
			{ type: "subsection", label: "Policies" },
			{ type: "link", slug: "openpolicy/policies/overview", title: "Overview" },
			{ type: "link", slug: "openpolicy/policies/quick-start", title: "Quick Start" },
			{ type: "link", slug: "openpolicy/policies/privacy", title: "Privacy" },
			{ type: "link", slug: "openpolicy/policies/cookies", title: "Cookies" },
			{ type: "link", slug: "openpolicy/policies/auto-collect", title: "Auto-collect" },
			{ type: "subsection", label: "Cookie banner" },
			{ type: "link", slug: "openpolicy/cookies/overview", title: "Overview" },
			{ type: "subsection", label: "References" },
			{ type: "link", slug: "openpolicy/references/examples", title: "Examples" },
			{ type: "link", slug: "openpolicy/references/jurisdictions", title: "Jurisdictions" },
		],
	},
	{
		index: "01",
		label: "OpenCookies",
		rootSlug: "opencookies",
		items: [
			{ type: "link", slug: "opencookies", title: "Introduction" },
			{ type: "subsection", label: "Core" },
			{ type: "link", slug: "opencookies/core", title: "Concepts" },
			{ type: "subsection", label: "Adapters" },
			{ type: "link", slug: "opencookies/react", title: "React" },
			{ type: "link", slug: "opencookies/vue", title: "Vue" },
			{ type: "link", slug: "opencookies/solid", title: "Solid" },
			{ type: "link", slug: "opencookies/svelte", title: "Svelte" },
			{ type: "link", slug: "opencookies/angular", title: "Angular" },
			{ type: "subsection", label: "Tools" },
			{ type: "link", slug: "opencookies/scanner", title: "Scanner" },
			{ type: "link", slug: "opencookies/vite", title: "Vite plugin" },
			{ type: "link", slug: "opencookies/cli", title: "CLI" },
			{ type: "link", slug: "opencookies/scripts", title: "Script integrations" },
		],
	},
];

export const docsLinks: DocsLink[] = docsNav.flatMap((g) =>
	g.items.filter((i): i is DocsLink => i.type === "link"),
);

export function findAdjacent(slug: string): {
	prev: DocsLink | null;
	next: DocsLink | null;
} {
	const idx = docsLinks.findIndex((l) => l.slug === slug);
	if (idx === -1) return { prev: null, next: null };
	return {
		prev: idx > 0 ? docsLinks[idx - 1] : null,
		next: idx < docsLinks.length - 1 ? docsLinks[idx + 1] : null,
	};
}

export function findGroupForSlug(slug: string): DocsGroup | undefined {
	return docsNav.find((g) => slug === g.rootSlug || slug.startsWith(`${g.rootSlug}/`));
}
