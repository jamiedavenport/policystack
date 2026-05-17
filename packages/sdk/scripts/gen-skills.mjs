// Snapshots the PolicyStack AI skill pack to the repo-root `plugin/` tree and
// the marketplace manifest (PS-32). Runs after `vp pack` so it reads the same
// built artifact consumers import. The single source of truth is
// `renderSkillPack()` in src/skills.ts; this only writes its output to disk.
// `skills.test.ts` guards the snapshot from drift.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSkillPack } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

for (const { path, content } of renderSkillPack()) {
	const out = join(repoRoot, path);
	mkdirSync(dirname(out), { recursive: true });
	writeFileSync(out, content);
	process.stdout.write(`Wrote ${out}\n`);
}
