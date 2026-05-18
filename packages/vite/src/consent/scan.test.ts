import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { scan } from "./scan";

const root = mkdtempSync(join(tmpdir(), "policystack-consent-scan-"));

function file(rel: string, body: string): void {
	const full = join(root, rel);
	const dir = full.slice(0, full.lastIndexOf("/"));
	mkdirSync(dir, { recursive: true });
	writeFileSync(full, body);
}

file("src/a.ts", `document.cookie = 'a=1';\n`);
file("src/b.ts", `import 'posthog-js';\nposthog.capture('e');\n`);
file(
	"src/gated.tsx",
	`export function Gated() {\n  return (\n    <ConsentGate purpose="analytics">\n      {(() => { document.cookie = 'g=1'; return null; })()}\n    </ConsentGate>\n  );\n}\n`,
);
file("src/suppressed.ts", `// policystack-ignore-next-line\ndocument.cookie = 'c=1';\n`);
file("src/ignored.d.ts", `declare const foo: any;\n`);
file("node_modules/lib/index.ts", `document.cookie = 'x=1';\n`);

afterAll(() => {
	// tmpdir is OS-cleaned; nothing to do
});

describe("scan", () => {
	it("finds cookie writes, vendor hits, and skips excluded paths", async () => {
		const result = await scan({ cwd: root });
		expect(result.cookies.map((c) => c.kind)).toEqual(["document.cookie", "document.cookie"]);
		expect(result.vendors.map((v) => v.vendor)).toEqual(["posthog", "posthog"]);
		expect(result.cookies.every((c) => !c.file.includes("node_modules"))).toBe(true);
	});

	it("respects // policystack-ignore-next-line", async () => {
		const result = await scan({ cwd: root });
		const fromSuppressed = result.cookies.filter((c) => c.file.endsWith("suppressed.ts"));
		expect(fromSuppressed).toEqual([]);
	});

	it("classifies ConsentGate-wrapped writes as gated", async () => {
		const result = await scan({ cwd: root });
		const fromGated = result.ungated.filter((u) => u.file.endsWith("gated.tsx"));
		expect(fromGated).toEqual([]);
	});

	it("flags top-level cookie writes as ungated", async () => {
		const result = await scan({ cwd: root });
		const fromA = result.ungated.filter((u) => u.file.endsWith("/src/a.ts"));
		expect(fromA).toHaveLength(1);
		expect(fromA[0]!.reason).toBe("cookie-outside-gate");
	});
});
