import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { extractFromFile, type ThirdPartyEntry } from "./analyse";
import { KNOWN_COOKIE_PACKAGES, KNOWN_PACKAGES } from "./known-packages";
import { walkSources } from "./scan";
import { type CookieMap, renderGenModule, type Scanned } from "./scanned";
import { formatIssue, loadAndValidateConfig, type ValidatedConfig } from "./validate";

export type OpenPolicyOptions = {
	/**
	 * Directory walked for `collecting()` calls. Resolved relative to the
	 * Vite project root. Defaults to `"src"`.
	 */
	srcDir?: string;
	/**
	 * File extensions scanned. Defaults to `[".ts", ".tsx"]`.
	 */
	extensions?: string[];
	/**
	 * Extra directory names skipped during the walk. Appended to the built-in
	 * defaults (`node_modules`, `dist`, `.git`, `.next`, `.output`,
	 * `.svelte-kit`, `.cache`).
	 */
	ignore?: string[];

	thirdParties?: {
		usePackageJson?: boolean;
	};

	cookies?: {
		usePackageJson?: boolean;
	};

	/**
	 * Run `validateOpenPolicyConfig` (and the per-policy validators) against
	 * the resolved `openpolicy.ts` after each scan. Errors fail `vite build`
	 * (`PluginContext.error`); warnings are reported (`PluginContext.warn`)
	 * but never block. In dev, both error and warning issues are logged
	 * through the dev-server logger and never crash HMR. Defaults to `true`.
	 */
	validate?: boolean;
};

/**
 * Name of the generated module emitted next to the user's `openpolicy.ts`.
 * The user imports it explicitly; it carries the scanned values and the
 * `@openpolicy/sdk` type augmentation.
 */
const GEN_FILENAME = "openpolicy.gen.ts";

/**
 * Common locations for the user's `openpolicy.ts` config, in priority order.
 * The plugin emits `openpolicy.gen.ts` alongside the first one that exists so
 * the generated file sits next to the config in the editor and in git.
 */
const CONFIG_CANDIDATES = [
	"openpolicy.ts",
	"src/openpolicy.ts",
	"src/lib/openpolicy.ts",
	"app/openpolicy.ts",
	"lib/openpolicy.ts",
];

async function findConfig(root: string): Promise<{ dir: string; file: string | null }> {
	for (const candidate of CONFIG_CANDIDATES) {
		const path = resolve(root, candidate);
		try {
			await access(path);
			return { dir: dirname(path), file: path };
		} catch {}
	}
	return { dir: root, file: null };
}

/**
 * Emits the on-disk `openpolicy.gen.ts` module next to the user's
 * `openpolicy.ts`. The module is imported explicitly by the config and carries
 * the scanned values (`dataCollected` / `thirdParties` / `cookies`) plus a
 * `declare module "@openpolicy/sdk"` augmentation of `ScannedCollectionKeys` /
 * `ScannedCookieKeys`, so `defineConfig` requires every scanned category to
 * have matching `data.context` (with `purpose`, `lawfulBasis`, `retention`,
 * and `provision`) and `cookies.context` entries. Commit the file — that
 * keeps both the values and the type-level constraints live in CI without
 * needing to run the Vite plugin first.
 */
async function writeGenModule(targetDir: string, scanned: Scanned): Promise<void> {
	await writeFile(resolve(targetDir, GEN_FILENAME), renderGenModule(scanned), "utf8");
}

/**
 * Vite plugin that scans source files for `@openpolicy/sdk` `collecting()`,
 * `thirdParty()`, and `defineCookie()` calls at the start of each build and
 * emits the discovered data into an on-disk `openpolicy.gen.ts` module next
 * to the user's `openpolicy.ts`.
 *
 * The user imports the generated values explicitly from `./openpolicy.gen`,
 * so the scanned data is an ordinary part of the consumer's own source — no
 * virtual-module interception, no `optimizeDeps`/`ssr.noExternal` pins, and
 * HMR is normal file invalidation. The generated module also augments
 * `@openpolicy/sdk`'s `ScannedCollectionKeys` / `ScannedCookieKeys` so
 * `defineConfig` still forces a sibling legal-context entry per scanned key.
 */
export function openPolicy(options: OpenPolicyOptions = {}): Plugin {
	const srcDirOpt = options.srcDir ?? "src";
	const extensions = options.extensions ?? [".ts", ".tsx"];
	const ignore = options.ignore ?? [];
	const usePackageJsonOpt = options.thirdParties?.usePackageJson ?? false;
	const useCookiesPackageJsonOpt = options.cookies?.usePackageJson ?? false;
	const validateOpt = options.validate ?? true;
	let resolvedRoot: string;
	let resolvedSrcDir: string;
	let resolvedConfigDir: string;
	let resolvedConfigFile: string | null = null;
	let resolvedCommand: "build" | "serve" = "build";
	let scanned: Scanned = {
		dataCollected: {},
		thirdParties: [],
		cookies: { essential: true },
	};

	async function readPackageJsonDeps(root: string): Promise<Record<string, string>> {
		let raw: string;
		try {
			raw = await readFile(resolve(root, "package.json"), "utf8");
		} catch {
			return {};
		}
		let pkg: {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		try {
			pkg = JSON.parse(raw) as typeof pkg;
		} catch {
			return {};
		}
		return { ...pkg.dependencies, ...pkg.devDependencies };
	}

	async function detectThirdPartiesFromPackageJson(root: string): Promise<ThirdPartyEntry[]> {
		const allDeps = await readPackageJsonDeps(root);
		const entries: ThirdPartyEntry[] = [];
		const seenNames = new Set<string>();
		for (const pkgName of Object.keys(allDeps)) {
			const entry = KNOWN_PACKAGES.get(pkgName);
			if (entry && !seenNames.has(entry.name)) {
				seenNames.add(entry.name);
				entries.push(entry);
			}
		}
		return entries;
	}

	async function detectCookiesFromPackageJson(root: string): Promise<string[]> {
		const allDeps = await readPackageJsonDeps(root);
		const categories = new Set<string>();
		for (const pkgName of Object.keys(allDeps)) {
			const cats = KNOWN_COOKIE_PACKAGES.get(pkgName);
			if (!cats) continue;
			for (const cat of cats) categories.add(cat);
		}
		return [...categories];
	}

	async function scanAndMerge(): Promise<Scanned> {
		const files = await walkSources(resolvedSrcDir, extensions, ignore);
		const mergedData: Record<string, string[]> = {};
		const mergedParties: ThirdPartyEntry[] = [];
		const seenParties = new Set<string>();
		const cookieSet = new Set<string>();
		const genFile = resolvedConfigDir ? resolve(resolvedConfigDir, GEN_FILENAME) : null;
		for (const file of files) {
			if (file === genFile) continue;
			let code: string;
			try {
				code = await readFile(file, "utf8");
			} catch {
				continue;
			}
			const extracted = extractFromFile(file, code);
			for (const [category, labels] of Object.entries(extracted.dataCollected)) {
				const existing = mergedData[category] ?? [];
				const seen = new Set(existing);
				for (const label of labels) {
					if (!seen.has(label)) {
						existing.push(label);
						seen.add(label);
					}
				}
				mergedData[category] = existing;
			}
			for (const entry of extracted.thirdParties) {
				if (!seenParties.has(entry.name)) {
					seenParties.add(entry.name);
					mergedParties.push(entry);
				}
			}
			for (const cat of extracted.cookies) cookieSet.add(cat);
		}
		if (usePackageJsonOpt) {
			const pkgEntries = await detectThirdPartiesFromPackageJson(resolvedRoot);
			for (const entry of pkgEntries) {
				if (!seenParties.has(entry.name)) {
					seenParties.add(entry.name);
					mergedParties.push(entry);
				}
			}
		}
		if (useCookiesPackageJsonOpt) {
			const pkgCookies = await detectCookiesFromPackageJson(resolvedRoot);
			for (const cat of pkgCookies) cookieSet.add(cat);
		}
		const cookies: CookieMap = { essential: true };
		for (const cat of cookieSet) {
			if (cat === "essential") continue;
			cookies[cat] = true;
		}
		return {
			dataCollected: mergedData,
			thirdParties: mergedParties,
			cookies,
		};
	}

	/**
	 * Returns true when `file` lives inside `resolvedSrcDir` and has one of
	 * the tracked extensions. Used by the dev-server watcher to skip events
	 * for unrelated files (configs, public assets, other packages, etc.).
	 */
	function isTrackedSource(file: string): boolean {
		// The generated module lives inside srcDir; never treat our own write
		// to it as a source change, or the watcher would re-scan in a loop.
		if (resolvedConfigDir && file === resolve(resolvedConfigDir, GEN_FILENAME)) return false;
		const rel = relative(resolvedSrcDir, file);
		if (!rel || rel.startsWith("..")) return false;
		return extensions.some((ext) => file.endsWith(ext));
	}

	/**
	 * Re-runs the scan and, if anything changed, rewrites `openpolicy.gen.ts`.
	 * The user's `openpolicy.ts` imports that module, so Vite picks up the
	 * write through normal file invalidation — no virtual-module poking and no
	 * manual full-reload.
	 */
	async function rescanAndRefresh(server: ViteDevServer): Promise<void> {
		const next = await scanAndMerge();
		const changed = JSON.stringify(next) !== JSON.stringify(scanned);
		if (changed) {
			scanned = next;
			await writeGenModule(resolvedConfigDir, scanned);
		}
		await runValidationDev(server);
	}

	async function runValidationDev(server: ViteDevServer): Promise<void> {
		if (!validateOpt || !resolvedConfigFile) return;
		let result: ValidatedConfig;
		try {
			result = await loadAndValidateConfig({
				configFile: resolvedConfigFile,
			});
		} catch (err) {
			server.config.logger.error(`[openpolicy] validation crashed: ${err}`);
			return;
		}
		if (result.loadError) {
			// Don't double-report TS/import errors — the user's own pipeline
			// already shows them. Surface only the message at warn level so
			// it's discoverable without spamming.
			server.config.logger.warn(
				`[openpolicy] could not load config for validation: ${result.loadError.message}`,
			);
			return;
		}
		for (const issue of result.issues) {
			const line = formatIssue(issue);
			if (issue.level === "error") server.config.logger.error(line);
			else server.config.logger.warn(line);
		}
	}

	return {
		name: "openpolicy",
		enforce: "pre",
		configResolved(config) {
			resolvedRoot = config.root;
			resolvedSrcDir = resolve(config.root, srcDirOpt);
			resolvedCommand = config.command;
		},
		async buildStart() {
			const found = await findConfig(resolvedRoot);
			resolvedConfigDir = found.dir;
			resolvedConfigFile = found.file;
			scanned = await scanAndMerge();
			await writeGenModule(resolvedConfigDir, scanned);
			// Only validate via Rollup's PluginContext in `vite build` —
			// `this.error` aborts the build, which is the desired CI signal.
			// In `vite dev` we let `configureServer` handle validation
			// through the dev-server logger so HMR isn't crashed.
			if (validateOpt && resolvedConfigFile && resolvedCommand === "build") {
				const result = await loadAndValidateConfig({
					configFile: resolvedConfigFile,
				});
				if (result.loadError) {
					this.warn(
						`[openpolicy] could not load config for validation: ${result.loadError.message}`,
					);
				} else {
					const errors = result.issues.filter((i) => i.level === "error");
					const warnings = result.issues.filter((i) => i.level === "warning");
					for (const issue of warnings) this.warn(formatIssue(issue));
					if (errors.length > 0) {
						const lines = errors.map(formatIssue).join("\n");
						this.error(
							`OpenPolicy validation found ${errors.length} error${errors.length === 1 ? "" : "s"}:\n${lines}`,
						);
					}
				}
			}
		},
		configureServer(server) {
			// Make sure chokidar watches the whole src tree, not just files
			// already in the module graph. Without this, creating a brand-new
			// source file that nothing imports yet wouldn't fire a watcher
			// event — the very case we most need to re-scan on.
			server.watcher.add(resolvedSrcDir);

			// Watch the config file too so edits to `openpolicy.ts` re-run
			// validation even when no scanned source has changed.
			if (resolvedConfigFile) server.watcher.add(resolvedConfigFile);

			const handler = async (file: string): Promise<void> => {
				const tracked = isTrackedSource(file);
				const isConfig = resolvedConfigFile !== null && file === resolvedConfigFile;
				if (!tracked && !isConfig) return;
				// Surface errors via the logger but don't rethrow — an
				// unhandled rejection would crash the watcher process.
				try {
					await rescanAndRefresh(server);
				} catch (error) {
					server.config.logger.error(`[openpolicy] rescan failed: ${error}`);
				}
			};

			server.watcher.on("change", handler);
			server.watcher.on("add", handler);
			server.watcher.on("unlink", handler);

			// Replay validation through the dev-server logger. `buildStart`
			// already validated in build mode via `this.error`/`this.warn`,
			// but Vite's dev pipeline doesn't expose that PluginContext to
			// the terminal in the same way — so we re-emit through the
			// server logger for visibility on `vite dev` startup.
			void runValidationDev(server);
		},
	};
}
