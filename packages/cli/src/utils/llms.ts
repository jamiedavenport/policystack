import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderLlmsTxt } from "@policystack/sdk";

// The SDK reference is written next to the stub so a project-relative path in
// the prompt resolves regardless of where the stub lands (root or src/).
export function resolveLlmsPath(stubPath: string): string {
	return join(dirname(stubPath), "policystack.llms.txt");
}

type WriteLlmsResult = { path: string; written: boolean };

// `renderLlmsTxt()` is the single source of truth — the same function the
// `@policystack/sdk` package snapshots and `apps/web` serves. Bundling it here
// (not reading node_modules) keeps the write working under --skip-install.
// Always refreshed so an upgraded CLI overwrites a stale local copy.
export async function writeLlms(path: string): Promise<WriteLlmsResult> {
	const written = !existsSync(path);
	await writeFile(path, renderLlmsTxt());
	return { path, written };
}
