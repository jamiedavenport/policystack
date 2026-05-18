import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { resolveLlmsPath, writeLlms } from "./llms";

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "op-llms-"));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

test("resolveLlmsPath sits next to the stub", () => {
	expect(resolveLlmsPath(join(dir, "src", "policystack.ts"))).toBe(
		join(dir, "src", "policystack.llms.txt"),
	);
});

test("writeLlms writes the canonical reference and reports create vs update", async () => {
	const path = resolveLlmsPath(join(dir, "policystack.ts"));

	const first = await writeLlms(path);
	expect(first.written).toBe(true);
	expect(readFileSync(path, "utf8")).toContain("# PolicyStack SDK reference (llms.txt)");

	const second = await writeLlms(path);
	expect(second.written).toBe(false);
});
