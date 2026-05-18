// Snapshots the canonical llms.txt that `@policystack/sdk` ships (PS-27).
// Runs after `vp pack` so it reads the same built artifact consumers import.
// The single source of truth is `renderLlmsTxt()` in src/llms.ts; this only
// writes its output to disk. `llms.test.ts` guards the snapshot from drift.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderLlmsTxt } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "llms.txt");
writeFileSync(out, renderLlmsTxt());
process.stdout.write(`Wrote ${out}\n`);
