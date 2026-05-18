import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Integration = {
	pkg: string;
	dev: boolean;
	trigger: string;
};

const RULES: Array<{ trigger: string; pkg: string; dev: boolean }> = [
	{ trigger: "vite", pkg: "@policystack/vite", dev: true },
	{ trigger: "react", pkg: "@policystack/react", dev: false },
	{ trigger: "vue", pkg: "@policystack/vue", dev: false },
	{ trigger: "svelte", pkg: "@policystack/svelte", dev: false },
];

export function detectIntegrations(cwd: string): Integration[] {
	const pkgPath = join(cwd, "package.json");
	let raw: {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
		optionalDependencies?: Record<string, string>;
	};
	try {
		raw = JSON.parse(readFileSync(pkgPath, "utf8"));
	} catch {
		return [];
	}
	const all = new Set<string>([
		...Object.keys(raw.dependencies ?? {}),
		...Object.keys(raw.devDependencies ?? {}),
		...Object.keys(raw.peerDependencies ?? {}),
		...Object.keys(raw.optionalDependencies ?? {}),
	]);
	return RULES.filter((r) => all.has(r.trigger)).map((r) => ({
		trigger: r.trigger,
		pkg: r.pkg,
		dev: r.dev,
	}));
}
