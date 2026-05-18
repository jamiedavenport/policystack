import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Subset of the host app's package.json we seed overridable company.* defaults
// from. Every field optional — a host may have none of them, or no
// package.json at all.
export type HostPackageMeta = {
	name?: string;
	url?: string;
	email?: string;
};

// npm's canonical people-string form: "Name <email> (url)". We only want the
// address inside the angle brackets.
function parseAuthorEmail(author: string): string | undefined {
	const m = author.match(/<([^>]+)>/);
	return m?.[1]?.trim() || undefined;
}

// Reads the host package.json at `cwd` (the host app's own — no parent walk)
// for company.* seeds. NEVER throws: defineConfig() and validate() run under
// Vitest/SSR where cwd may lack a package.json or hold malformed JSON; either
// way the caller just gets no seeds.
export function readHostPackageMeta(cwd: string = process.cwd()): HostPackageMeta {
	try {
		const pkgPath = join(cwd, "package.json");
		if (!existsSync(pkgPath)) return {};
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
			name?: string;
			homepage?: string;
			author?: string | { name?: string; email?: string; url?: string };
		};
		const { author } = pkg;
		const email =
			typeof author === "string"
				? parseAuthorEmail(author)
				: typeof author === "object" && author !== null
					? author.email
					: undefined;
		return { name: pkg.name, url: pkg.homepage, email };
	} catch {
		return {};
	}
}
