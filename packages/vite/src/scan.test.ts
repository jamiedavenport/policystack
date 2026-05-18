import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { walkSources } from "./scan";

let tmp: string;

beforeEach(async () => {
	tmp = await mkdtemp(join(tmpdir(), "openpolicy-scan-"));
});

afterEach(async () => {
	await rm(tmp, { recursive: true, force: true });
});

async function touch(rel: string, content = ""): Promise<void> {
	const full = join(tmp, rel);
	const dir = full.slice(0, full.lastIndexOf("/"));
	await mkdir(dir, { recursive: true });
	await writeFile(full, content, "utf8");
}

test("returns empty array when root does not exist", async () => {
	const files = await walkSources(join(tmp, "missing"), [".ts"]);
	expect(files).toEqual([]);
});

test("returns empty array when root is empty", async () => {
	const files = await walkSources(tmp, [".ts"]);
	expect(files).toEqual([]);
});

test("walks nested directories", async () => {
	await touch("a.ts", "");
	await touch("nested/b.ts", "");
	await touch("nested/deep/c.ts", "");

	const files = await walkSources(tmp, [".ts"]);
	expect(files.map((f) => relative(tmp, f))).toEqual(["a.ts", "nested/b.ts", "nested/deep/c.ts"]);
});

test("filters by extension", async () => {
	await touch("a.ts", "");
	await touch("b.tsx", "");
	await touch("c.js", "");
	await touch("d.json", "");

	const files = await walkSources(tmp, [".ts", ".tsx"]);
	expect(files.map((f) => relative(tmp, f)).sort()).toEqual(["a.ts", "b.tsx"]);
});

test("skips node_modules and other default ignores", async () => {
	await touch("src/a.ts", "");
	await touch("node_modules/pkg/b.ts", "");
	await touch("dist/c.ts", "");
	await touch(".git/hooks/d.ts", "");
	await touch(".next/server/e.ts", "");

	const files = await walkSources(tmp, [".ts"]);
	expect(files.map((f) => relative(tmp, f))).toEqual(["src/a.ts"]);
});

test("honours extra user ignores", async () => {
	await touch("src/a.ts", "");
	await touch("generated/b.ts", "");

	const files = await walkSources(tmp, [".ts"], ["generated"]);
	expect(files.map((f) => relative(tmp, f))).toEqual(["src/a.ts"]);
});

test("returns absolute paths", async () => {
	await touch("a.ts", "");

	const files = await walkSources(tmp, [".ts"]);
	expect(files).toHaveLength(1);
	expect(files[0]?.startsWith("/")).toBe(true);
});

// FROZEN 1.0 CONTRACT (1.md §6 / §7.6). The multi-file merge order is the
// lexicographic sort of absolute source paths; it determines `dataCollected`
// / `thirdParties` array order in `policystack.gen.ts` and therefore the
// policy `version` hash. This test pins that order so a future refactor that
// reorders the walk fails loudly. Do not relax it without a deliberate
// breaking-change decision.
test("merge order is the frozen lexicographic sort regardless of creation order", async () => {
	// Created in deliberately scrambled order.
	await touch("m/charlie.ts", "");
	await touch("a/zulu.ts", "");
	await touch("a/alpha.ts", "");
	await touch("z/bravo.ts", "");
	await touch("m/alpha.ts", "");

	const files = await walkSources(tmp, [".ts"]);
	expect(files.map((f) => relative(tmp, f))).toEqual([
		"a/alpha.ts",
		"a/zulu.ts",
		"m/alpha.ts",
		"m/charlie.ts",
		"z/bravo.ts",
	]);
});
