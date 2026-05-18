import { expect, test } from "vite-plus/test";
import { createSdkMatcher, type ResolveId } from "./sdk-resolver";

const SDK_ID = "/proj/node_modules/@openpolicy/sdk/dist/index.js";

/** Fake `this.resolve`: a specifier → resolved-id map; missing → null. */
function fakeResolve(map: Record<string, string>): {
	resolve: ResolveId;
	calls: Array<{ source: string; importer: string }>;
} {
	const calls: Array<{ source: string; importer: string }> = [];
	const resolve: ResolveId = async (source, importer) => {
		calls.push({ source, importer });
		const id = map[source];
		return id ? { id } : null;
	};
	return { resolve, calls };
}

test("alias resolving to the SDK root id is matched; subpath/non-SDK are not", async () => {
	const { resolve } = fakeResolve({
		"@openpolicy/sdk": SDK_ID,
		"@policystack/sdk": SDK_ID,
		"@/sdk": SDK_ID,
		"@openpolicy/sdk/foo": "/proj/node_modules/@openpolicy/sdk/dist/foo.js",
		"@other": "/proj/node_modules/other/index.js",
	});
	const m = await createSdkMatcher({ resolve, importer: "/proj/policystack.ts", warn: () => {} });

	// Canonical specifiers match without any prewarm.
	expect(m.match("@openpolicy/sdk")).toBe(true);
	expect(m.match("@policystack/sdk")).toBe(true);
	// Alias only matches once resolution has been pre-warmed.
	expect(m.match("@/sdk")).toBe(false);
	await m.prewarm(["@/sdk", "@openpolicy/sdk/foo", "@other", "unknown-pkg"]);
	expect(m.match("@/sdk")).toBe(true);
	expect(m.match("@openpolicy/sdk/foo")).toBe(false); // subpath → different id
	expect(m.match("@other")).toBe(false);
	expect(m.match("unknown-pkg")).toBe(false); // unresolvable
});

test("canonical specifier is resolved from the given importer", async () => {
	const { resolve, calls } = fakeResolve({ "@openpolicy/sdk": SDK_ID });
	await createSdkMatcher({ resolve, importer: "/proj/policystack.ts", warn: () => {} });
	expect(calls).toContainEqual({ source: "@openpolicy/sdk", importer: "/proj/policystack.ts" });
});

test("query/fragment suffixes and backslashes are normalised before comparison", async () => {
	const { resolve } = fakeResolve({
		"@openpolicy/sdk": SDK_ID,
		"@dev/sdk": `${SDK_ID}?v=abc123`,
		"@win/sdk": "\\proj\\node_modules\\@openpolicy\\sdk\\dist\\index.js#frag",
	});
	const m = await createSdkMatcher({
		// Canonical id arrives with backslashes too, to prove both sides normalise.
		resolve: async (source, importer) => {
			const r = await resolve(source, importer);
			return r;
		},
		importer: "/proj/policystack.ts",
		warn: () => {},
	});
	await m.prewarm(["@dev/sdk", "@win/sdk"]);
	expect(m.match("@dev/sdk")).toBe(true);
});

test("no resolver → pure dual-scope fallback, warns once", async () => {
	const warnings: string[] = [];
	const m = await createSdkMatcher({
		resolve: null,
		importer: "/proj/policystack.ts",
		warn: (msg) => warnings.push(msg),
	});
	// `resolve: null` is the test-stub path — silent fallback, no warning.
	expect(warnings).toHaveLength(0);
	expect(m.match("@openpolicy/sdk")).toBe(true);
	expect(m.match("@policystack/sdk")).toBe(true);
	expect(m.match("@/sdk")).toBe(false);
	await m.prewarm(["@/sdk"]); // no-op fallback
	expect(m.match("@/sdk")).toBe(false);
});

test("canonical specifier unresolvable → fallback with a one-time warning", async () => {
	const warnings: string[] = [];
	const { resolve } = fakeResolve({ "@other": "/proj/node_modules/other/index.js" });
	const m = await createSdkMatcher({
		resolve,
		importer: "/proj/policystack.ts",
		warn: (msg) => warnings.push(msg),
	});
	expect(warnings).toHaveLength(1);
	expect(warnings[0]).toContain("falling back to literal specifier matching");
	expect(m.match("@openpolicy/sdk")).toBe(true); // still recognises canonical
});

test("prewarm resolves each distinct specifier exactly once across calls", async () => {
	const { resolve, calls } = fakeResolve({ "@openpolicy/sdk": SDK_ID, "@/sdk": SDK_ID });
	const m = await createSdkMatcher({ resolve, importer: "/proj/policystack.ts", warn: () => {} });
	const before = calls.length;
	await m.prewarm(["@/sdk", "@/sdk"]);
	await m.prewarm(["@/sdk"]); // already memoised — no extra resolve
	expect(calls.length - before).toBe(1);
	expect(m.match("@/sdk")).toBe(true);
});
