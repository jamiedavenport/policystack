import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";
import { snapshotVersion } from "./snapshot-version.mjs";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
test("V1 snapshots build with native version routes and leave live content alone", async () => {
	const fixture = await mkdtemp(resolve(root, ".version-check-"));
	try {
		await mkdir(resolve(fixture, "content/docs"), { recursive: true });
		await mkdir(resolve(fixture, "content/blog"));
		await symlink(resolve(root, "node_modules"), resolve(fixture, "node_modules"), "dir");
		await writeFile(resolve(fixture, "package.json"), '{"type":"module","private":true}');
		await writeFile(resolve(fixture, "versions.json"), '{"current":{"label":"V1"},"archived":[]}');
		await writeFile(
			resolve(fixture, "blume.config.ts"),
			`import { defineConfig } from "blume";\nimport versions from "./versions.json";\nexport default defineConfig({ content: {root:"content"}, deployment: {site:"https://policystack.dev"}, versions, seo:{og:{enabled:false}} });`,
		);
		const doc =
			'---\ntitle: V1 introduction\ndescription: Version fixture\n---\n\nV1 only. [Guide](/docs/guide) [Roadmap](/docs/roadmap) [Blog](/blog/post)\n\n```ts\nconst example = "/docs/guide";\n```\n';
		await writeFile(resolve(fixture, "content/docs/index.md"), doc);
		await writeFile(
			resolve(fixture, "content/docs/guide.md"),
			"---\ntitle: V1 guide\n---\n\n[Introduction](/docs).",
		);
		await writeFile(
			resolve(fixture, "content/docs/roadmap.md"),
			"---\ntitle: Roadmap\nai:\n  exclude: true\n---\n\nFuture only.",
		);
		await writeFile(
			resolve(fixture, "content/blog/post.md"),
			"---\ntitle: Post\ntype: blog\ndate: 2026-09-06\n---\n\nPost.",
		);
		await snapshotVersion(fixture, "v1");
		assert.deepEqual((await readdir(resolve(fixture, "content/v1"))).sort(), ["docs", "index.md"]);
		assert.deepEqual((await readdir(resolve(fixture, "content/v1/docs"))).sort(), [
			"guide.md",
			"index.md",
		]);
		const frozen = await readFile(resolve(fixture, "content/v1/docs/index.md"), "utf8");
		assert.ok(frozen.includes("[Guide](/v1/docs/guide)"));
		assert.ok(frozen.includes("[Roadmap](/docs/roadmap)"));
		assert.ok(frozen.includes('const example = "/docs/guide";'));
		assert.equal(await readFile(resolve(fixture, "content/docs/index.md"), "utf8"), doc);
		await assert.rejects(snapshotVersion(fixture, "v1"), /already archived/);
		await assert.rejects(snapshotVersion(fixture, "../v2"), /version ID/);
		await writeFile(
			resolve(fixture, "versions.json"),
			'{"current":{"label":"V2"},"archived":[{"id":"v1","label":"V1"}]}',
		);
		await writeFile(
			resolve(fixture, "content/docs/index.md"),
			"---\ntitle: V2 introduction\n---\n\nCurrent V2.",
		);
		await exec(resolve(root, "node_modules/.bin/blume"), ["build"], {
			cwd: fixture,
			maxBuffer: 2_000_000,
		});
		const archive = await readFile(resolve(fixture, "dist/v1/docs/index.html"), "utf8");
		assert.match(archive, /V1 introduction/);
		assert.match(archive, /Go to latest/);
		assert.ok((await readFile(resolve(fixture, "dist/v1/docs.md"), "utf8")).includes("V1 only"));
		assert.ok(
			!(await readFile(resolve(fixture, "dist/llms-full.txt"), "utf8")).includes("V1 only"),
		);
	} finally {
		await rm(fixture, { recursive: true, force: true });
	}
});
