import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { policyStack } from "../index";

// Proves PS-19's core invariant: ONE plugin object carries both rule sets.
// The PolicyStack Consent consent scan is folded into the same `policyStack()` plugin
// (no second exported plugin) and is opt-in via the `consent` option.

type AnyFn = (...args: unknown[]) => unknown;

type LoggerCapture = {
	logger: { info: AnyFn; warn: AnyFn; error: AnyFn };
	infos: string[];
	warns: string[];
	errors: string[];
};

function captureLogger(): LoggerCapture {
	const infos: string[] = [];
	const warns: string[] = [];
	const errors: string[] = [];
	return {
		infos,
		warns,
		errors,
		logger: {
			info: (m: unknown) => infos.push(String(m)),
			warn: (m: unknown) => warns.push(String(m)),
			error: (m: unknown) => errors.push(String(m)),
		},
	};
}

// Minimal Rollup PluginContext stub. `error` throws (Rollup contract); the
// consent path must never reach it — only `buildEnd` aborts.
function pluginCtx(): { warn: AnyFn; error: AnyFn } {
	return {
		warn: () => {},
		error: (m: unknown) => {
			throw new Error(String(m));
		},
	};
}

async function driveBuild(
	plugin: ReturnType<typeof policyStack>,
	root: string,
	cap: LoggerCapture,
): Promise<void> {
	const configResolved = plugin.configResolved as AnyFn;
	await configResolved({ root, command: "build", logger: cap.logger });
	const buildStart = plugin.buildStart as AnyFn;
	await buildStart.call(pluginCtx());
}

function callBuildEnd(plugin: ReturnType<typeof policyStack>): void {
	(plugin.buildEnd as AnyFn).call({});
}

let tmp: string;
beforeEach(async () => {
	tmp = await mkdtemp(join(tmpdir(), "policystack-consent-fold-"));
});
afterEach(async () => {
	await rm(tmp, { recursive: true, force: true });
});

describe("PS-19 single-plugin fold", () => {
	it("exposes one plugin with both rule sets' lifecycle hooks", () => {
		const plugin = policyStack({ consent: { mode: "warn" } });
		expect(plugin.name).toBe("policystack");
		expect(typeof plugin.buildStart).toBe("function");
		expect(typeof plugin.configureServer).toBe("function");
		// `buildEnd` is the consent build-fail seam added by PS-19.
		expect(typeof plugin.buildEnd).toBe("function");
	});

	it("is fully inert when the `consent` option is omitted", async () => {
		await writeFile(join(tmp, "track.ts"), "document.cookie = 'x=1';\n");
		const plugin = policyStack();
		const cap = captureLogger();
		await driveBuild(plugin, tmp, cap);
		// No consent option → no consent scan, no findings logged, buildEnd
		// never throws even though an ungated write exists.
		expect(cap.errors).toEqual([]);
		expect(() => callBuildEnd(plugin)).not.toThrow();
	});

	it("mode:'error' fails the build from buildEnd on an ungated write", async () => {
		await writeFile(join(tmp, "track.ts"), "document.cookie = 'x=1';\n");
		const plugin = policyStack({ consent: { mode: "error" } });
		const cap = captureLogger();
		await driveBuild(plugin, tmp, cap);
		expect(cap.errors.some((m) => m.includes("ungated"))).toBe(true);
		expect(() => callBuildEnd(plugin)).toThrow(/ungated finding/);
	});

	it("mode:'warn' logs but never fails the build", async () => {
		await writeFile(join(tmp, "track.ts"), "document.cookie = 'x=1';\n");
		const plugin = policyStack({ consent: { mode: "warn" } });
		const cap = captureLogger();
		await driveBuild(plugin, tmp, cap);
		expect(cap.warns.some((m) => m.includes("ungated"))).toBe(true);
		expect(() => callBuildEnd(plugin)).not.toThrow();
	});
});
