import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const DEFAULT_IGNORES: ReadonlySet<string> = new Set([
	"node_modules",
	"dist",
	".git",
	".next",
	".output",
	".svelte-kit",
	".cache",
]);

/**
 * Recursively walks `root`, returning absolute paths of every regular file
 * whose extension is in `extensions`. Directories whose basename appears in
 * the built-in ignore list (or the extra `ignore` argument) are skipped
 * entirely.
 *
 * Missing roots resolve to an empty array — the plugin must not throw if the
 * user's `srcDir` hasn't been created yet.
 */
export async function walkSources(
	root: string,
	extensions: readonly string[],
	ignore: readonly string[] = [],
): Promise<string[]> {
	const ignored = new Set<string>([...DEFAULT_IGNORES, ...ignore]);
	const exts = new Set(extensions);
	const results: string[] = [];

	async function walk(dir: string): Promise<void> {
		let entries: Dirent[];
		try {
			entries = (await readdir(dir, { withFileTypes: true })) as Dirent[];
		} catch (err) {
			const code = (err as NodeJS.ErrnoException).code;
			if (code === "ENOENT" || code === "ENOTDIR") return;
			throw err;
		}
		for (const entry of entries) {
			if (ignored.has(entry.name)) continue;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				await walk(full);
			} else if (entry.isFile() && exts.has(extname(entry.name))) {
				results.push(full);
			}
		}
	}

	await walk(root);
	// FROZEN 1.0 CONTRACT (1.md §6 / §7.6): the multi-file merge order is the
	// default lexicographic sort of absolute source paths. `scanAndMerge`
	// folds per-file results in this order, so it fixes the array order of
	// `dataCollected` labels and `thirdParties` in `policystack.gen.ts`, which
	// in turn feeds `compilePolicy()`'s deterministic `version` hash
	// (`@policystack/core` policy-version.ts sorts object keys but preserves
	// array order). Removing this sort or changing the collation is a
	// breaking change — keep it.
	results.sort();
	return results;
}
