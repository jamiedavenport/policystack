import { readFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";
import { glob } from "tinyglobby";
import { CONSENT_REGISTRY } from "../registry";
import { parseFile } from "./parser";
import { applySuppressions } from "./suppress";
import { walk } from "./visit";
import { cookiesNextRule } from "./rules/cookies-next";
import { documentCookieRule } from "./rules/document-cookie";
import { jsCookieRule } from "./rules/js-cookie";
import { nextHeadersRule } from "./rules/next-headers";
import { reactCookieRule } from "./rules/react-cookie";
import { setCookieHeaderRule } from "./rules/set-cookie-header";
import { vendorImportsRule } from "./rules/vendor-imports";
import type {
	Cookie,
	Hit,
	Rule,
	ScanOptions,
	ScanResult,
	Ungated,
	VendorHit,
	VendorRegistry,
} from "./types";

export const DEFAULT_INCLUDE = ["**/*.{js,jsx,ts,tsx,vue,svelte,mjs,cjs,mts,cts}"];
export const DEFAULT_EXCLUDE = [
	"**/node_modules/**",
	"**/dist/**",
	"**/build/**",
	"**/.next/**",
	"**/.nuxt/**",
	"**/.svelte-kit/**",
	"**/coverage/**",
	"**/*.d.ts",
];

export const defaultRules: Rule[] = [
	documentCookieRule,
	jsCookieRule,
	cookiesNextRule,
	reactCookieRule,
	nextHeadersRule,
	setCookieHeaderRule,
	vendorImportsRule,
];

export const defaultVendors: VendorRegistry = CONSENT_REGISTRY;

export async function scan(options: ScanOptions): Promise<ScanResult> {
	const cwd = resolve(options.cwd);
	const include = options.include ?? DEFAULT_INCLUDE;
	const exclude = options.exclude ?? DEFAULT_EXCLUDE;
	const rules = options.rules ?? defaultRules;
	const registry = options.vendors ?? defaultVendors;
	const concurrency = Math.max(1, options.concurrency ?? availableParallelism());

	const files = await glob(include, {
		cwd,
		ignore: exclude,
		absolute: true,
		onlyFiles: true,
		dot: false,
	});

	const cookies: Cookie[] = [];
	const vendors: VendorHit[] = [];
	const ungated: Ungated[] = [];

	let cursor = 0;
	async function worker(): Promise<void> {
		while (true) {
			const i = cursor++;
			if (i >= files.length) return;
			const abs = files[i]!;
			try {
				const source = await readFile(abs, "utf8");
				const parsed = parseFile(abs, source);
				if (!parsed) continue;
				const result = walk(parsed, rules, registry);
				const filtered = applySuppressions(result.hits, parsed.comments);
				const dropped = new Set<Hit>();
				if (filtered.length !== result.hits.length) {
					const kept = new Set(filtered);
					for (const h of result.hits) if (!kept.has(h)) dropped.add(h);
				}
				for (const hit of filtered) {
					if ("kind" in hit) cookies.push(hit);
					else vendors.push(hit);
				}
				for (const u of result.ungated) {
					if (!dropped.has(u.hit)) ungated.push(u);
				}
			} catch {
				// unparsable files are skipped silently; the rest of the scan continues
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()));

	cookies.sort(orderHits);
	vendors.sort(orderHits);
	ungated.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));

	return { cookies, vendors, ungated };
}

function orderHits(a: { file: string; line: number; column: number }, b: typeof a): number {
	if (a.file !== b.file) return a.file.localeCompare(b.file);
	if (a.line !== b.line) return a.line - b.line;
	return a.column - b.column;
}
