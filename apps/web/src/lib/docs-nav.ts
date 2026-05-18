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
		label: "PolicyStack",
		rootSlug: "policy",
		items: [
			{ type: "link", slug: "policy", title: "Introduction" },
			{ type: "link", slug: "policy/cli", title: "CLI" },
			{ type: "link", slug: "policy/agent-skills", title: "AI skill pack" },
			{ type: "link", slug: "policy/configuration", title: "Configuration" },
			{ type: "link", slug: "policy/i18n", title: "Internationalization" },
			{ type: "subsection", label: "Policies" },
			{ type: "link", slug: "policy/policies/overview", title: "Overview" },
			{ type: "link", slug: "policy/policies/quick-start", title: "Quick Start" },
			{ type: "link", slug: "policy/policies/privacy", title: "Privacy" },
			{ type: "link", slug: "policy/policies/cookies", title: "Cookies" },
			{ type: "link", slug: "policy/policies/auto-collect", title: "Auto-collect" },
			{ type: "subsection", label: "Cookie banner" },
			{ type: "link", slug: "policy/cookies/overview", title: "Overview" },
			{ type: "subsection", label: "References" },
			{ type: "link", slug: "policy/references/examples", title: "Examples" },
			{ type: "link", slug: "policy/references/jurisdictions", title: "Jurisdictions" },
		],
	},
	{
		index: "01",
		label: "PolicyStack Consent",
		rootSlug: "consent",
		items: [
			{ type: "link", slug: "consent", title: "Introduction" },
			{ type: "subsection", label: "Core" },
			{ type: "link", slug: "consent/core", title: "Concepts" },
			{ type: "subsection", label: "Adapters" },
			{ type: "link", slug: "consent/react", title: "React" },
			{ type: "link", slug: "consent/vue", title: "Vue" },
			{ type: "link", slug: "consent/solid", title: "Solid" },
			{ type: "link", slug: "consent/svelte", title: "Svelte" },
			{ type: "link", slug: "consent/angular", title: "Angular" },
			{ type: "subsection", label: "Tools" },
			{ type: "link", slug: "consent/scanner", title: "Scanner" },
			{ type: "link", slug: "consent/vite", title: "Vite plugin" },
			{ type: "link", slug: "consent/cli", title: "CLI" },
			{ type: "link", slug: "consent/scripts", title: "Script integrations" },
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
