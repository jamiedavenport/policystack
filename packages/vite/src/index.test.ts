import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { ThirdPartyEntry } from "./analyse";
import { openPolicy } from "./index";

type PluginInstance = ReturnType<typeof openPolicy>;

let tmp: string;

beforeEach(async () => {
	tmp = await mkdtemp(join(tmpdir(), "openpolicy-vite-"));
});

afterEach(async () => {
	await rm(tmp, { recursive: true, force: true });
});

async function touch(rel: string, content: string): Promise<void> {
	const full = join(tmp, rel);
	await mkdir(dirname(full), { recursive: true });
	await writeFile(full, content, "utf8");
}

/**
 * Captures `error` / `warn` calls from the Rollup PluginContext so build-mode
 * validation paths can be asserted. `error` matches Rollup's contract by
 * throwing — the plugin uses `this.error` to abort the build.
 */
type PluginContextStub = {
	errors: string[];
	warnings: string[];
	error(msg: string): never;
	warn(msg: string): void;
};

function createPluginContext(): PluginContextStub {
	const ctx: PluginContextStub = {
		errors: [],
		warnings: [],
		error(msg: string): never {
			ctx.errors.push(msg);
			throw new Error(msg);
		},
		warn(msg: string): void {
			ctx.warnings.push(msg);
		},
	};
	return ctx;
}

/**
 * Invokes `configResolved` and `buildStart` in the order Vite would, so the
 * plugin's internal `scanned` state is populated.
 */
async function runPluginBuildStart(
	plugin: PluginInstance,
	root: string,
	options: { command?: "build" | "serve"; ctx?: PluginContextStub } = {},
): Promise<PluginContextStub> {
	const command = options.command ?? "build";
	const configResolved = plugin.configResolved as
		| ((config: { root: string; command: "build" | "serve" }) => void | Promise<void>)
		| undefined;
	if (configResolved) await configResolved({ root, command });
	const buildStart = plugin.buildStart as
		| ((this: PluginContextStub) => void | Promise<void>)
		| undefined;
	const ctx = options.ctx ?? createPluginContext();
	if (buildStart) await buildStart.call(ctx);
	return ctx;
}

type ScannedResult = {
	dataCollected: Record<string, string[]>;
	thirdParties: ThirdPartyEntry[];
	cookies: { essential: boolean; [key: string]: boolean };
};

/**
 * Reads the on-disk `openpolicy.gen.ts` the plugin emits and parses the three
 * scanned exports back out. The values are emitted as compact JSON (valid
 * TypeScript), so each `export const … = <json>;` line round-trips through
 * `JSON.parse`. `root` is where the gen file lands — the project root when
 * there's no `openpolicy.ts`, otherwise the config's directory.
 */
async function readScanned(root: string): Promise<ScannedResult> {
	const source = await readFile(join(root, "openpolicy.gen.ts"), "utf8");

	function parse<T>(name: string): T {
		const match = source.match(new RegExp(`export const ${name}:[^=]*= (.*);\\n`));
		if (!match) throw new Error(`could not parse ${name} from:\n${source}`);
		return JSON.parse(match[1] as string) as T;
	}

	return {
		dataCollected: parse<Record<string, string[]>>("dataCollected"),
		thirdParties: parse<ThirdPartyEntry[]>("thirdParties"),
		cookies: parse<{ essential: boolean; [key: string]: boolean }>("cookies"),
	};
}

type WatcherEvent = "change" | "add" | "unlink";
type WatcherHandler = (file: string) => void | Promise<void>;

type StubServer = {
	watcherAdded: string[];
	loggedErrors: string[];
	loggedWarnings: string[];
	runHandler: (event: WatcherEvent, file: string) => Promise<void>;
	// biome-ignore lint/suspicious/noExplicitAny: ad-hoc ViteDevServer stub.
	server: any;
};

/**
 * Builds a minimal stand-in for `ViteDevServer`. The plugin no longer pokes
 * the module graph or sends WS messages — HMR is normal file invalidation —
 * so the stub only captures watcher registrations and logger output.
 * `runHandler` invokes a registered watcher listener and awaits its async
 * body so tests can assert post-state without a sleep or a microtask dance.
 */
function createStubServer(): StubServer {
	const handlers: Record<WatcherEvent, WatcherHandler[]> = {
		change: [],
		add: [],
		unlink: [],
	};
	const watcherAdded: string[] = [];
	const loggedErrors: string[] = [];
	const loggedWarnings: string[] = [];

	// biome-ignore lint/suspicious/noExplicitAny: see StubServer.
	const server: any = {
		watcher: {
			add(path: string): void {
				watcherAdded.push(path);
			},
			on(event: WatcherEvent, cb: WatcherHandler): void {
				handlers[event].push(cb);
			},
		},
		config: {
			logger: {
				error(msg: string): void {
					loggedErrors.push(msg);
				},
				warn(msg: string): void {
					loggedWarnings.push(msg);
				},
			},
		},
	};

	async function runHandler(event: WatcherEvent, file: string): Promise<void> {
		for (const cb of handlers[event]) {
			await cb(file);
		}
	}

	return {
		watcherAdded,
		loggedErrors,
		loggedWarnings,
		runHandler,
		server,
	};
}

test("buildStart writes scanned categories to the gen module", async () => {
	await touch(
		"src/lib/db.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		export function createUser(name: string, email: string) {
			return collecting("Account Information", { name, email }, {
				name: "Name",
				email: "Email address",
			});
		}
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).dataCollected).toEqual({
		"Account Information": ["Name", "Email address"],
	});
});

test("merges calls across multiple files", async () => {
	// Files are walked in sorted order, so `a-users.ts` runs before
	// `b-pages.ts`. Label order reflects first-seen insertion.
	await touch(
		"src/a-users.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Account Information", v, { a: "Name", b: "Email" });
		`,
	);
	await touch(
		"src/b-pages.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Usage Data", v, { p: "Pages visited" });
		collecting("Account Information", v, { c: "Phone" });
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).dataCollected).toEqual({
		"Account Information": ["Name", "Email", "Phone"],
		"Usage Data": ["Pages visited"],
	});
});

test("ignores files outside the configured srcDir", async () => {
	await touch(
		"src/ok.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("In", v, { x: "X" });
		`,
	);
	await touch(
		"other/nope.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Out", v, { x: "X" });
		`,
	);

	const plugin = openPolicy({ srcDir: "src" });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).dataCollected).toEqual({ In: ["X"] });
});

test("respects a custom srcDir", async () => {
	await touch(
		"app/foo.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Cat", v, { x: "X" });
		`,
	);

	const plugin = openPolicy({ srcDir: "app" });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).dataCollected).toEqual({ Cat: ["X"] });
});

test("emits an empty object when srcDir contains no collecting() calls", async () => {
	await touch("src/noop.ts", `export const x = 1;\n`);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).dataCollected).toEqual({});
});

test("emits an empty object when srcDir is missing entirely", async () => {
	const plugin = openPolicy({ srcDir: "missing" });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).dataCollected).toEqual({});
});

test("scans .tsx files by default", async () => {
	await touch(
		"src/Widget.tsx",
		`
		import { collecting } from "@openpolicy/sdk";
		export function Widget() {
			collecting("Widget", v, { x: "X" });
			return null;
		}
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).dataCollected).toEqual({ Widget: ["X"] });
});

test("the plugin exposes no interception hooks (resolveId/load/config)", () => {
	const plugin = openPolicy();
	expect(plugin.resolveId).toBeUndefined();
	expect(plugin.load).toBeUndefined();
	expect(plugin.config).toBeUndefined();
});

test("configureServer adds resolvedSrcDir to the chokidar watch set", async () => {
	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	expect(stub.watcherAdded).toContain(join(tmp, "src"));
});

test("dev watcher re-scans and rewrites the gen module when a tracked file changes", async () => {
	await touch(
		"src/lib/db.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Initial", v, { x: "X" });
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	expect((await readScanned(tmp)).dataCollected).toEqual({ Initial: ["X"] });

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	// User adds a second collecting() call — simulate both the file write
	// and the watcher event chokidar would emit.
	await touch(
		"src/lib/db.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Initial", v, { x: "X" });
		collecting("Added", v, { y: "Y" });
		`,
	);
	await stub.runHandler("change", join(tmp, "src/lib/db.ts"));

	expect((await readScanned(tmp)).dataCollected).toEqual({
		Initial: ["X"],
		Added: ["Y"],
	});
});

test("dev watcher picks up newly-created source files", async () => {
	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	expect((await readScanned(tmp)).dataCollected).toEqual({});

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	await touch(
		"src/new.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Brand New", v, { z: "Z" });
		`,
	);
	await stub.runHandler("add", join(tmp, "src/new.ts"));

	expect((await readScanned(tmp)).dataCollected).toEqual({ "Brand New": ["Z"] });
});

test("dev watcher drops categories when a file is deleted", async () => {
	await touch(
		"src/gone.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("Temporary", v, { x: "X" });
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	expect((await readScanned(tmp)).dataCollected).toEqual({ Temporary: ["X"] });

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	await rm(join(tmp, "src/gone.ts"));
	await stub.runHandler("unlink", join(tmp, "src/gone.ts"));

	expect((await readScanned(tmp)).dataCollected).toEqual({});
});

test("dev watcher ignores events for files outside srcDir", async () => {
	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	const before = await readFile(join(tmp, "openpolicy.gen.ts"), "utf8");

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	await touch("other/x.ts", `export const x = 1;\n`);
	await stub.runHandler("change", join(tmp, "other/x.ts"));

	// Event filtered out — the gen module is left untouched.
	expect(await readFile(join(tmp, "openpolicy.gen.ts"), "utf8")).toBe(before);
});

test("dev watcher ignores events for files with untracked extensions", async () => {
	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	const before = await readFile(join(tmp, "openpolicy.gen.ts"), "utf8");

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	await touch("src/README.md", `# hello\n`);
	await stub.runHandler("change", join(tmp, "src/README.md"));

	expect(await readFile(join(tmp, "openpolicy.gen.ts"), "utf8")).toBe(before);
});

test("dev watcher does not rewrite the gen module when the gen file itself changes", async () => {
	// The gen file lives inside srcDir; the plugin's own write to it must not
	// be treated as a tracked-source change, or the watcher would loop.
	await touch(
		"src/a.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("A", v, { x: "X" });
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	const before = await readFile(join(tmp, "openpolicy.gen.ts"), "utf8");

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	await stub.runHandler("change", join(tmp, "openpolicy.gen.ts"));

	expect(await readFile(join(tmp, "openpolicy.gen.ts"), "utf8")).toBe(before);
});

test("dev watcher leaves the gen module unchanged when the scan output is unchanged", async () => {
	await touch(
		"src/a.ts",
		`
		import { collecting } from "@openpolicy/sdk";
		collecting("A", v, { x: "X" });
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	const before = await readFile(join(tmp, "openpolicy.gen.ts"), "utf8");

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	// Touch the file with a harmless edit that preserves collecting() shape.
	await touch(
		"src/a.ts",
		`
		// comment added
		import { collecting } from "@openpolicy/sdk";
		collecting("A", v, { x: "X" });
		`,
	);
	await stub.runHandler("change", join(tmp, "src/a.ts"));

	expect(await readFile(join(tmp, "openpolicy.gen.ts"), "utf8")).toBe(before);
});

// ---------------------------------------------------------------------------
// thirdParty() integration tests
// ---------------------------------------------------------------------------

test("thirdParty() calls are scanned and appear in the gen module thirdParties export", async () => {
	await touch(
		"src/payments.ts",
		`
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
});

test("thirdParty() deduplication across files — same name in two files yields one entry", async () => {
	// Files are walked in sorted order: a-file.ts before b-file.ts.
	// First occurrence wins.
	await touch(
		"src/a-file.ts",
		`
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		`,
	);
	await touch(
		"src/b-file.ts",
		`
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Billing", "https://stripe.com/other");
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
});

test("dev watcher triggers reload when thirdParty() call is added", async () => {
	await touch("src/payments.ts", `export const x = 1;\n`);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	expect((await readScanned(tmp)).thirdParties).toEqual([]);

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	await touch(
		"src/payments.ts",
		`
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		`,
	);
	await stub.runHandler("change", join(tmp, "src/payments.ts"));

	expect((await readScanned(tmp)).thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
});

// ---------------------------------------------------------------------------
// usePackageJson tests
// ---------------------------------------------------------------------------

test("usePackageJson is disabled by default — package.json with stripe does not add entries", async () => {
	await touch("package.json", JSON.stringify({ dependencies: { stripe: "^14.0.0" } }));

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).thirdParties).toEqual([]);
});

test("usePackageJson: known package is detected and added as ThirdPartyEntry", async () => {
	await touch("package.json", JSON.stringify({ dependencies: { stripe: "^14.0.0" } }));

	const plugin = openPolicy({ thirdParties: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	const { thirdParties } = await readScanned(tmp);
	expect(thirdParties).toHaveLength(1);
	expect(thirdParties[0]?.name).toBe("Stripe");
	expect(thirdParties[0]?.purpose).toBe("Payment processing");
});

test("usePackageJson: unknown package is silently ignored", async () => {
	await touch("package.json", JSON.stringify({ dependencies: { "some-unknown-pkg": "^1.0.0" } }));

	const plugin = openPolicy({ thirdParties: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).thirdParties).toEqual([]);
});

test("usePackageJson: multiple packages mapping to same service yield one entry", async () => {
	await touch(
		"package.json",
		JSON.stringify({
			dependencies: { stripe: "^14.0.0", "@stripe/stripe-js": "^3.0.0" },
		}),
	);

	const plugin = openPolicy({ thirdParties: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	const { thirdParties } = await readScanned(tmp);
	expect(thirdParties.filter((e) => e.name === "Stripe")).toHaveLength(1);
});

test("usePackageJson: manual thirdParty() call wins over auto-detected entry", async () => {
	await touch("package.json", JSON.stringify({ dependencies: { stripe: "^14.0.0" } }));
	await touch(
		"src/payments.ts",
		`
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Custom billing purpose", "https://stripe.com/custom");
		`,
	);

	const plugin = openPolicy({ thirdParties: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	const { thirdParties } = await readScanned(tmp);
	const stripeEntries = thirdParties.filter((e) => e.name === "Stripe");
	expect(stripeEntries).toHaveLength(1);
	expect(stripeEntries[0]?.purpose).toBe("Custom billing purpose");
	expect(stripeEntries[0]?.policyUrl).toBe("https://stripe.com/custom");
});

test("usePackageJson: graceful when package.json is missing", async () => {
	await touch(
		"src/payments.ts",
		`
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		`,
	);

	const plugin = openPolicy({ thirdParties: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
});

// ---------------------------------------------------------------------------
// cookie detection tests
// ---------------------------------------------------------------------------

test("cookies: empty scan emits essential-only map", async () => {
	await touch("src/noop.ts", `export const x = 1;\n`);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).cookies).toEqual({ essential: true });
});

test("cookies: defineCookie() adds the category", async () => {
	await touch(
		"src/cookies.ts",
		`
		import { defineCookie } from "@openpolicy/sdk";
		defineCookie("analytics");
		defineCookie("marketing");
		`,
	);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).cookies).toEqual({
		essential: true,
		analytics: true,
		marketing: true,
	});
});

test("cookies: usePackageJson disabled by default — posthog-js alone does not add analytics", async () => {
	await touch("package.json", JSON.stringify({ dependencies: { "posthog-js": "^1.0.0" } }));

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).cookies).toEqual({ essential: true });
});

test("cookies: usePackageJson — posthog-js detected as analytics", async () => {
	await touch("package.json", JSON.stringify({ dependencies: { "posthog-js": "^1.0.0" } }));

	const plugin = openPolicy({ cookies: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).cookies).toEqual({
		essential: true,
		analytics: true,
	});
});

test("cookies: usePackageJson + defineCookie unions categories", async () => {
	await touch("package.json", JSON.stringify({ dependencies: { "posthog-js": "^1.0.0" } }));
	await touch(
		"src/cookies.ts",
		`
		import { defineCookie } from "@openpolicy/sdk";
		defineCookie("marketing");
		`,
	);

	const plugin = openPolicy({ cookies: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).cookies).toEqual({
		essential: true,
		analytics: true,
		marketing: true,
	});
});

test("cookies: usePackageJson graceful when package.json missing", async () => {
	const plugin = openPolicy({ cookies: { usePackageJson: true } });
	await runPluginBuildStart(plugin, tmp);

	expect((await readScanned(tmp)).cookies).toEqual({ essential: true });
});

test("cookies: dev watcher reloads when a cookie-relevant call is added", async () => {
	await touch("src/x.ts", `export const x = 1;\n`);

	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	expect((await readScanned(tmp)).cookies).toEqual({ essential: true });

	const stub = createStubServer();
	await runConfigureServer(plugin, stub.server);

	await touch(
		"src/x.ts",
		`
		import { defineCookie } from "@openpolicy/sdk";
		defineCookie("analytics");
		`,
	);
	await stub.runHandler("change", join(tmp, "src/x.ts"));

	expect((await readScanned(tmp)).cookies).toEqual({
		essential: true,
		analytics: true,
	});
});

/**
 * Invokes the plugin's `configureServer` hook with the given stub. Handles
 * both the plain-function and object-hook shapes that Vite allows.
 */
function runConfigureServer(
	plugin: PluginInstance,
	// biome-ignore lint/suspicious/noExplicitAny: see StubServer.
	server: any,
): void | Promise<void> {
	const hook = plugin.configureServer as unknown;
	if (typeof hook === "function") {
		return (hook as (s: unknown) => void | Promise<void>)(server);
	}
	if (hook && typeof (hook as { handler?: unknown }).handler === "function") {
		return (hook as { handler: (s: unknown) => void | Promise<void> }).handler(server);
	}
	throw new Error("plugin has no configureServer hook");
}

test("buildStart writes openpolicy.gen.ts with scanned keys", async () => {
	await touch(
		"src/a.ts",
		`import { collecting } from "@openpolicy/sdk";\n` +
			`collecting("Account Information", v, { email: "Email" });\n` +
			`collecting("Session Data", v, { ip: "IP" });\n`,
	);
	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	const dts = await readFile(join(tmp, "openpolicy.gen.ts"), "utf8");
	// Type augmentation.
	expect(dts).toContain('declare module "@openpolicy/sdk"');
	expect(dts).toContain("interface ScannedCollectionKeys");
	expect(dts).toContain('"Account Information": true');
	expect(dts).toContain('"Session Data": true');
	expect(dts).toContain("interface ScannedCookieKeys");
	// First-class module: explicit type import, real value exports, no
	// `export {}` stub, and no virtual-module body.
	expect(dts).toContain('import type { ScannedCollectionKeys } from "@openpolicy/sdk"');
	expect(dts).toContain("export const dataCollected:");
	expect(dts).toContain("export const thirdParties:");
	expect(dts).toContain("export const cookies:");
	expect(dts).not.toContain("export {};");
	// The emitted values round-trip back through the reader.
	expect((await readScanned(tmp)).dataCollected).toEqual({
		"Account Information": ["Email"],
		"Session Data": ["IP"],
	});
});

test("buildStart includes scanned cookie keys in ScannedCookieKeys", async () => {
	await touch(
		"src/cookies.ts",
		`import { defineCookie } from "@openpolicy/sdk";\n` +
			`defineCookie("analytics");\n` +
			`defineCookie("marketing");\n`,
	);
	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	const dts = await readFile(join(tmp, "openpolicy.gen.ts"), "utf8");
	expect(dts).toContain("interface ScannedCookieKeys");
	expect(dts).toContain('"analytics": true');
	expect(dts).toContain('"marketing": true');
});

test("buildStart writes an empty ScannedCollectionKeys interface when no calls are found", async () => {
	await touch("src/a.ts", "export const noop = 1;\n");
	const plugin = openPolicy();
	await runPluginBuildStart(plugin, tmp);
	const dts = await readFile(join(tmp, "openpolicy.gen.ts"), "utf8");
	expect(dts).toContain("interface ScannedCollectionKeys {");
	expect(dts).not.toContain('"Account Information"');
});

test("buildStart emits openpolicy.gen.ts next to openpolicy.ts inside src/", async () => {
	await touch("src/openpolicy.ts", "export default {} as const;\n");
	await touch(
		"src/a.ts",
		`import { collecting } from "@openpolicy/sdk";\n` +
			`collecting("Account Information", v, { email: "Email" });\n`,
	);
	const plugin = openPolicy({ validate: false });
	await runPluginBuildStart(plugin, tmp);
	const dts = await readFile(join(tmp, "src/openpolicy.gen.ts"), "utf8");
	expect(dts).toContain('"Account Information": true');
});

test("buildStart emits openpolicy.gen.ts next to openpolicy.ts inside src/lib/", async () => {
	await touch("src/lib/openpolicy.ts", "export default {} as const;\n");
	await touch(
		"src/a.ts",
		`import { collecting } from "@openpolicy/sdk";\n` +
			`collecting("Account Information", v, { email: "Email" });\n`,
	);
	const plugin = openPolicy({ validate: false });
	await runPluginBuildStart(plugin, tmp);
	const dts = await readFile(join(tmp, "src/lib/openpolicy.gen.ts"), "utf8");
	expect(dts).toContain('"Account Information": true');
});

test("validate:false skips config load entirely (stub config does not crash buildStart)", async () => {
	// A `{}` config would fail every required-field check; with validate
	// disabled, buildStart must not even load the file.
	await touch("src/openpolicy.ts", "export default {} as const;\n");
	const plugin = openPolicy({ validate: false });
	const ctx = await runPluginBuildStart(plugin, tmp);
	expect(ctx.errors).toEqual([]);
	expect(ctx.warnings).toEqual([]);
});

test("vite dev (command: 'serve') does not abort via this.error even if config has issues", async () => {
	// Validation in `vite dev` flows through the dev-server logger inside
	// `configureServer`, never through PluginContext.error. A stub config
	// with multiple errors must not throw out of buildStart in serve mode.
	await touch("src/openpolicy.ts", "export default {} as const;\n");
	const plugin = openPolicy();
	const ctx = await runPluginBuildStart(plugin, tmp, { command: "serve" });
	expect(ctx.errors).toEqual([]);
});

test("validate:false still writes the gen module so scanned data still flows through", async () => {
	await touch(
		"src/lib/db.ts",
		`import { collecting } from "@openpolicy/sdk";
		collecting("Account Information", v, { name: "Name" });`,
	);
	const plugin = openPolicy({ validate: false });
	await runPluginBuildStart(plugin, tmp);
	expect((await readScanned(tmp)).dataCollected).toEqual({
		"Account Information": ["Name"],
	});
});
