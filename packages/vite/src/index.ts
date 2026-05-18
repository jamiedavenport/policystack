import { access, rename, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import type { IssueCode } from "@policystack/core";
import type { Plugin, ViteDevServer } from "vite";
import { renderGenModule, type Scanned } from "./scanned";
import { createSdkMatcher, type ResolveId } from "./sdk-resolver";
import { isCanonicalSdkSpecifier, type SdkSpecifierMatcher } from "./sdk-specifier";
import {
	formatIssue,
	formatScannerDiagnostic,
	loadAndValidateConfig,
	type ValidatedConfig,
} from "./validate";
import { applyDriftPolicy, crossCheck, type DriftCode, formatDrift } from "./drift";
import {
	formatHitLocation,
	formatUngated,
	type Logger,
	type Mode,
	report,
	reportFileDelta,
} from "./consent/reporter";
import { createUnifiedScanner, type UnifiedScanner } from "./unified-scan";

export type PolicyStackOptions = {
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
	 * Run `validate()` against the resolved `policystack.ts` after each scan.
	 * Errors fail `vite build`
	 * (`PluginContext.error`); warnings are reported (`PluginContext.warn`)
	 * but never block. In dev, both error and warning issues are logged
	 * through the dev-server logger and never crash HMR. Defaults to `true`.
	 *
	 * `strict` / `suppress` (below) shape the issue list before this
	 * error/warn split is applied.
	 */
	validate?: boolean;

	/**
	 * Promote every remaining warning to an error, so they fail `vite build`
	 * the same way real errors do. Applied *after* `suppress` — a suppressed
	 * code is never promoted. In dev, promoted issues log at error level but
	 * still never crash HMR. Defaults to `false`.
	 */
	strict?: boolean;

	/**
	 * Issue / drift codes to drop from the result entirely, at any level
	 * (errors included). Applied *before* `strict`. Use this to accept a known
	 * disclosure gap or an intentional declared-vs-used drift — the list lives
	 * in `vite.config.ts`, so the decision is committed and shows up in
	 * review. Does not silence config load/parse failures. Defaults to `[]`.
	 */
	suppress?: (IssueCode | DriftCode)[];

	/**
	 * Opt-in PolicyStack Consent consent scanner (folded in by PS-19). When this key
	 * is present, the same plugin also runs a *separate* oxc walk that flags
	 * ungated cookie writes / tracking-vendor usage. Omit it entirely to skip
	 * the consent scan — existing policy behaviour is unaffected.
	 *
	 * This is structural co-location only: the consent walk never contributes
	 * to `policystack.gen.ts` and is independent of `validate()` / `strict` /
	 * `suppress`. A single unified walk + declared-vs-used cross-check is
	 * PS-25.
	 */
	consent?: {
		/**
		 * `"error"` fails `vite build` on ungated findings (thrown from
		 * `buildEnd`); `"warn"` logs them; `"off"` disables the scan while
		 * keeping the option present. Defaults to `"error"` on `vite build`
		 * and `"warn"` on `vite dev`.
		 */
		mode?: Mode;
		/** Glob(s) of files to scan. Defaults to the consent scanner's own
		 * source globs (js/ts/jsx/tsx/vue/svelte). */
		include?: string[];
		/** Glob(s) to exclude. Defaults to node_modules/dist/build/etc. */
		exclude?: string[];
	};
};

/**
 * Name of the generated module emitted next to the user's `policystack.ts`.
 * The user imports it explicitly; it carries the scanned values and the
 * `@policystack/sdk` type augmentation.
 */
const GEN_FILENAME = "policystack.gen.ts";

/**
 * Common locations for the user's `policystack.ts` config, in priority order.
 * The plugin emits `policystack.gen.ts` alongside the first one that exists so
 * the generated file sits next to the config in the editor and in git.
 */
const CONFIG_CANDIDATES = [
	"policystack.ts",
	"src/policystack.ts",
	"src/lib/policystack.ts",
	"app/policystack.ts",
	"lib/policystack.ts",
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
 * Emits the on-disk `policystack.gen.ts` module next to the user's
 * `policystack.ts`. The module is imported explicitly by the config and carries
 * the scanned values (`dataCollected` / `thirdParties` / `cookies`) plus a
 * `declare module "@policystack/sdk"` augmentation of `ScannedCollectionKeys` /
 * `ScannedCookieKeys`, so `defineConfig` requires every scanned category to
 * have matching `data.context` (with `purpose`, `lawfulBasis`, `retention`,
 * and `provision`) and `cookies.context` entries. Commit the file — that
 * keeps both the values and the type-level constraints live in CI without
 * needing to run the Vite plugin first.
 *
 * The write is atomic: content goes to a unique temp sibling and is then
 * `rename`d over the target. A crashed or partial write (ENOSPC, an EACCES
 * mid-write, …) leaves the previously committed `policystack.gen.ts` intact —
 * the last-good output is retained rather than truncated. Throws on failure;
 * callers decide whether to warn-and-continue (build) or skip-and-retry (dev).
 */
async function writeGenModule(targetDir: string, scanned: Scanned): Promise<void> {
	const target = resolve(targetDir, GEN_FILENAME);
	// Same-directory temp so `rename` stays on one filesystem (atomic on
	// POSIX, replace-on-Windows). The `.tmp` extension keeps it out of
	// `walkSources` / `isTrackedSource`, which both gate on `.ts`/`.tsx`.
	const tmp = resolve(
		targetDir,
		`${GEN_FILENAME}.${process.pid}-${Math.random().toString(36).slice(2)}.tmp`,
	);
	try {
		await writeFile(tmp, renderGenModule(scanned), "utf8");
		await rename(tmp, target);
	} catch (err) {
		await rm(tmp, { force: true });
		throw err;
	}
}

/**
 * Vite plugin that scans source files for `@policystack/sdk` `collecting()`,
 * `thirdParty()`, and `defineCookie()` calls at the start of each build and
 * emits the discovered data into an on-disk `policystack.gen.ts` module next
 * to the user's `policystack.ts`.
 *
 * The user imports the generated values explicitly from `./policystack.gen`,
 * so the scanned data is an ordinary part of the consumer's own source — no
 * virtual-module interception, no `optimizeDeps`/`ssr.noExternal` pins, and
 * HMR is normal file invalidation. The generated module also augments
 * `@policystack/sdk`'s `ScannedCollectionKeys` / `ScannedCookieKeys` so
 * `defineConfig` still forces a sibling legal-context entry per scanned key.
 */
export function policyStack(options: PolicyStackOptions = {}): Plugin {
	const srcDirOpt = options.srcDir ?? "src";
	const extensions = options.extensions ?? [".ts", ".tsx"];
	const ignore = options.ignore ?? [];
	const usePackageJsonOpt = options.thirdParties?.usePackageJson ?? false;
	const useCookiesPackageJsonOpt = options.cookies?.usePackageJson ?? false;
	const validateOpt = options.validate ?? true;
	const strictOpt = options.strict ?? false;
	const suppressOpt = options.suppress ?? [];
	let resolvedRoot: string;
	let resolvedSrcDir: string;
	let resolvedConfigDir: string;
	let resolvedConfigFile: string | null = null;
	let resolvedCommand: "build" | "serve" = "build";
	// Opt-in PolicyStack Consent consent scanner (PS-19). Stays null unless
	// `options.consent` is set, so existing policy-only users see no change.
	let consentLogger: Logger | null = null;
	let consentMode: Mode = "warn";
	const consentEnabled = options.consent !== undefined;
	let unifiedScanner: UnifiedScanner | null = null;
	// Resolver-backed SDK matcher, built from `this.resolve` in `buildStart`.
	// Defaults are the pure dual-scope predicate so an out-of-order or
	// resolver-less call (test stubs, a dev rescan that somehow beats
	// `buildStart`) still recognises direct `@policystack/sdk` /
	// `@policystack/sdk` imports. Vite runs `buildStart` before the
	// `configureServer` watcher fires, so dev rescans reuse the captured
	// resolver matcher — no `PluginContext` is needed in `configureServer`.
	let sdkMatcher: SdkSpecifierMatcher = isCanonicalSdkSpecifier;
	let prewarmSdk: (specifiers: Iterable<string>) => Promise<void> = async () => {};
	let scanned: Scanned = {
		dataCollected: {},
		thirdParties: [],
		cookies: { essential: true },
		sharing: [],
		diagnostics: [],
	};

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
	 * Re-runs the scan and, if anything changed, rewrites `policystack.gen.ts`.
	 * The user's `policystack.ts` imports that module, so Vite picks up the
	 * write through normal file invalidation — no virtual-module poking and no
	 * manual full-reload.
	 */
	async function rescanAndRefresh(server: ViteDevServer): Promise<void> {
		if (!unifiedScanner) return;
		const next = (await unifiedScanner.fullScan()).scanned;
		const changed = JSON.stringify(next) !== JSON.stringify(scanned);
		if (changed) {
			// Commit the new in-memory state only once the write succeeds. On
			// failure `scanned` stays put so the `changed` check re-fires on
			// the next file event and retries — no permanent disk/memory drift,
			// and the prior `policystack.gen.ts` remains as last-good.
			try {
				await writeGenModule(resolvedConfigDir, next);
				scanned = next;
			} catch (err) {
				server.config.logger.warn(
					`[policystack] could not write ${GEN_FILENAME}: ${err}; keeping the previously generated module`,
				);
			}
		}
		// Re-emit scanner diagnostics every rescan (like validation below) so
		// a skipped recognized call stays visible after each edit. Not gated
		// by `validateOpt` — silent data loss is independent of config checks.
		for (const d of next.diagnostics) server.config.logger.warn(formatScannerDiagnostic(d));
		await runValidationDev(server);
	}

	async function runValidationDev(server: ViteDevServer): Promise<void> {
		if (!validateOpt || !resolvedConfigFile) return;
		let result: ValidatedConfig;
		try {
			result = await loadAndValidateConfig({
				configFile: resolvedConfigFile,
				strict: strictOpt,
				suppress: suppressOpt,
			});
		} catch (err) {
			server.config.logger.error(`[policystack] validation crashed: ${err}`);
			return;
		}
		if (result.loadError) {
			// Don't double-report TS/import errors — the user's own pipeline
			// already shows them. Surface only the message at warn level so
			// it's discoverable without spamming.
			server.config.logger.warn(
				`[policystack] could not load config for validation: ${result.loadError.message}`,
			);
			return;
		}
		for (const issue of result.issues) {
			const line = formatIssue(issue);
			if (issue.level === "error") server.config.logger.error(line);
			else server.config.logger.warn(line);
		}
		// §4.3 declared-vs-used cross-check replayed through the dev logger
		// (never crashes HMR — mirrors the validation dev path above).
		if (result.config) {
			const drift = applyDriftPolicy(
				crossCheck(result.config, scanned, unifiedScanner?.lastConsent()?.vendors ?? []),
				{ strict: strictOpt, suppress: suppressOpt },
			);
			for (const d of drift) {
				const line = formatDrift(d);
				if (d.level === "error") server.config.logger.error(line);
				else server.config.logger.warn(line);
			}
		}
	}

	return {
		name: "policystack",
		enforce: "pre",
		configResolved(config) {
			resolvedRoot = config.root;
			resolvedSrcDir = resolve(config.root, srcDirOpt);
			resolvedCommand = config.command;
			if (options.consent) {
				consentMode = options.consent.mode ?? (config.command === "build" ? "error" : "warn");
				// Report through Vite's logger (captured here), never via
				// `this.error` — the consent scan must only abort the build
				// from `buildEnd`, exactly like the old @opencookies/vite.
				consentLogger = config.logger;
			}
		},
		async buildStart() {
			const found = await findConfig(resolvedRoot);
			resolvedConfigDir = found.dir;
			resolvedConfigFile = found.file;
			// Adapt Rollup's `this.resolve` to the matcher's `ResolveId`. The
			// test stub omits `resolve`, so guard at runtime — a missing
			// resolver falls back to pure dual-scope matching.
			const resolveId: ResolveId | null =
				typeof this.resolve === "function"
					? async (source, importer) => {
							const r = await this.resolve(source, importer, {});
							return r ? { id: r.id } : null;
						}
					: null;
			// Resolve the canonical specifier from inside the user's project
			// (the config if found, else its package.json) so pnpm's strict
			// layout picks the same SDK copy the user's source files see.
			const sdkImporter = resolvedConfigFile ?? resolve(resolvedRoot, "package.json");
			const matcher = await createSdkMatcher({
				resolve: resolveId,
				importer: sdkImporter,
				warn: (msg) => this.warn(msg),
			});
			sdkMatcher = matcher.match;
			prewarmSdk = matcher.prewarm;
			unifiedScanner = createUnifiedScanner({
				root: resolvedRoot,
				srcDir: resolvedSrcDir,
				extensions,
				ignore,
				genFile: resolvedConfigDir ? resolve(resolvedConfigDir, GEN_FILENAME) : null,
				consentEnabled,
				consentInclude: options.consent?.include,
				consentExclude: options.consent?.exclude,
				usePackageJson: usePackageJsonOpt,
				useCookiesPackageJson: useCookiesPackageJsonOpt,
				sdkMatcher,
				prewarm: prewarmSdk,
			});
			const unified = await unifiedScanner.fullScan();
			scanned = unified.scanned;
			// A failed write must not abort the build. The in-memory `scanned`
			// stays fresh, so the validation block below is unaffected — only
			// the committed artifact is stale (last-good is retained on disk).
			try {
				await writeGenModule(resolvedConfigDir, scanned);
			} catch (err) {
				this.warn(
					`[policystack] could not write ${GEN_FILENAME}: ${err}; keeping the previously generated module`,
				);
			}
			// Always surface scanner diagnostics — a recognized call that
			// couldn't be read statically is silent data loss regardless of
			// the `validate` option. `this.warn` routes to the Rollup build
			// log on `vite build` and to Vite's logger on `vite dev` startup.
			for (const d of scanned.diagnostics) this.warn(formatScannerDiagnostic(d));
			// Only validate via Rollup's PluginContext in `vite build` —
			// `this.error` aborts the build, which is the desired CI signal.
			// In `vite dev` we let `configureServer` handle validation
			// through the dev-server logger so HMR isn't crashed.
			if (validateOpt && resolvedConfigFile && resolvedCommand === "build") {
				const result = await loadAndValidateConfig({
					configFile: resolvedConfigFile,
					strict: strictOpt,
					suppress: suppressOpt,
				});
				if (result.loadError) {
					this.warn(
						`[policystack] could not load config for validation: ${result.loadError.message}`,
					);
				} else {
					const errors = result.issues.filter((i) => i.level === "error");
					const warnings = result.issues.filter((i) => i.level === "warning");
					for (const issue of warnings) this.warn(formatIssue(issue));
					if (errors.length > 0) {
						const lines = errors.map(formatIssue).join("\n");
						this.error(
							`PolicyStack validation found ${errors.length} error${errors.length === 1 ? "" : "s"}:\n${lines}`,
						);
					}
					// §4.3 declared-vs-used cross-check (PS-25). Ordered *after*
					// config validation so a config `this.error()` abort
					// short-circuits it; drift then fails the build the same way.
					if (result.config) {
						const drift = applyDriftPolicy(
							crossCheck(result.config, scanned, unified.consent.vendors),
							{ strict: strictOpt, suppress: suppressOpt },
						);
						const driftErrors = drift.filter((d) => d.level === "error");
						for (const d of drift) if (d.level === "warning") this.warn(formatDrift(d));
						if (driftErrors.length > 0) {
							const lines = driftErrors.map(formatDrift).join("\n");
							this.error(
								`PolicyStack found ${driftErrors.length} declared-vs-used drift error${driftErrors.length === 1 ? "" : "s"}:\n${lines}`,
							);
						}
					}
				}
			}
			// Co-located PolicyStack Consent consent reporting (PS-19 → PS-25: now from
			// the same unified walk). Runs *after* policy validation, so a
			// policy `this.error()` abort still short-circuits it. Reports
			// through Vite's logger; only `buildEnd` fails the build.
			if (consentEnabled && consentLogger && consentMode !== "off") {
				report(unified.consent, consentLogger, { mode: consentMode, root: resolvedRoot });
			}
		},
		configureServer(server) {
			// Make sure chokidar watches the whole src tree, not just files
			// already in the module graph. Without this, creating a brand-new
			// source file that nothing imports yet wouldn't fire a watcher
			// event — the very case we most need to re-scan on.
			server.watcher.add(resolvedSrcDir);

			// Watch the config file too so edits to `policystack.ts` re-run
			// validation even when no scanned source has changed.
			if (resolvedConfigFile) server.watcher.add(resolvedConfigFile);

			const handler = async (file: string): Promise<void> => {
				// Consent rescan runs on its own broader gate (vue/svelte,
				// files outside srcDir) *before* the policy early-return.
				if (unifiedScanner && consentEnabled && consentMode !== "off") {
					try {
						const delta = await unifiedScanner.rescanFileConsent(file);
						if (delta) {
							reportFileDelta(delta.prev, delta.next, server.config.logger, {
								mode: consentMode,
								root: resolvedRoot,
								file,
							});
						}
					} catch (error) {
						server.config.logger.error(`[policystack] consent rescan failed: ${error}`);
					}
				}
				const tracked = isTrackedSource(file);
				const isConfig = resolvedConfigFile !== null && file === resolvedConfigFile;
				if (!tracked && !isConfig) return;
				// Surface errors via the logger but don't rethrow — an
				// unhandled rejection would crash the watcher process.
				try {
					await rescanAndRefresh(server);
				} catch (error) {
					server.config.logger.error(`[policystack] rescan failed: ${error}`);
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
		// Consent build-fail seam (PS-19): mirrors the old @opencookies/vite
		// — throws on remaining ungated findings when mode === "error".
		// Policy still fails separately via `this.error()` in buildStart.
		buildEnd(err?: Error) {
			if (err) return;
			if (!consentEnabled || consentMode !== "error" || !unifiedScanner) return;
			const result = unifiedScanner.lastConsent();
			if (!result || result.ungated.length === 0) return;
			const first = result.ungated[0]!;
			const loc = formatHitLocation(first.hit, resolvedRoot);
			const summary = formatUngated(first, resolvedRoot);
			const more = result.ungated.length > 1 ? ` (+${result.ungated.length - 1} more)` : "";
			throw new Error(`[policystack] ungated finding at ${loc}${more}\n${summary}`);
		},
	};
}
