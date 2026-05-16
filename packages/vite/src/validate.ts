import { type Issue, type OpenPolicyConfig, validate } from "@openpolicy/core";
import { bundleRequire } from "bundle-require";
import type { ScannerDiagnostic } from "./analyse";

export type ValidatedConfig = {
	config: OpenPolicyConfig | null;
	issues: Issue[];
	loadError: Error | null;
};

/**
 * The Vite plugin's `strict` / `suppress` issue policy (PS-13). `validate()`
 * itself stays pure and frozen; promotion/suppression is applied here, in the
 * one OSS consumer of `validate()`.
 */
export type IssuePolicy = {
	strict?: boolean;
	// `string` not `IssueCode`: the same suppress list also carries PS-25
	// `DriftCode`s. A drift code simply never matches an `Issue.code`, so it
	// is an inert no-op here — keeping one shared list (and decoupling
	// validate.ts from drift.ts).
	suppress?: readonly string[];
};

/**
 * Applies the {@link IssuePolicy} to a raw `validate()` result. Order matters:
 * `suppress` drops every issue whose `code` matches FIRST (any level), then
 * `strict` promotes the remaining warnings to errors — so a suppressed code is
 * never promoted. Pure; an absent/empty policy is the identity transform.
 */
export function applyIssuePolicy(issues: Issue[], policy: IssuePolicy): Issue[] {
	const suppressed = new Set<string>(policy.suppress ?? []);
	const kept = suppressed.size > 0 ? issues.filter((i) => !suppressed.has(i.code)) : issues;
	if (!policy.strict) return kept;
	return kept.map((i) => (i.level === "warning" ? { ...i, level: "error" } : i));
}

/**
 * Loads the user's `openpolicy.ts` via bundle-require, then runs the single
 * `validate()` exported from `@openpolicy/core` against the resolved config.
 * The config imports its scanned values from the on-disk `./openpolicy.gen`
 * module, so bundle-require resolves them as ordinary relative source — no
 * interception shim is needed. The caller must have written `openpolicy.gen.ts`
 * (via `writeGenModule`) before calling this. `validate()` operates on the
 * flat config and emits each code at most once, so no dedupe pass is needed.
 * The raw result is then run through {@link applyIssuePolicy} with the caller's
 * `strict` / `suppress` options. `loadError` is independent of the policy —
 * suppression never silences a config load/parse failure.
 *
 * Bundle-require errors (TS syntax errors, missing imports, runtime throws in
 * the user's config module) are surfaced as `loadError` rather than thrown so
 * the caller can decide whether to forward — TS errors should already be
 * caught by the user's type-check pipeline; we don't want to double-report.
 */
export async function loadAndValidateConfig(
	args: {
		configFile: string;
	} & IssuePolicy,
): Promise<ValidatedConfig> {
	let mod: { default?: OpenPolicyConfig };
	try {
		const result = await bundleRequire({
			filepath: args.configFile,
			// Inline `@openpolicy/*` into the bundled config instead of
			// externalising it. The config evaluates `defineConfig()` and the
			// SDK's basis/provision helpers, so the SDK must be resolvable;
			// bundle-require writes its output next to the config, and the
			// SDK is a workspace package that isn't present in every ambient
			// `node_modules` (pnpm doesn't hoist it to the workspace root), so
			// an externalised import would fail to resolve at runtime.
			notExternal: [/^@openpolicy\//],
			esbuildOptions: {
				platform: "node",
				// Esbuild prints to stderr by default. Silence it — we surface
				// failures through `loadError` and the caller decides how to
				// report. Otherwise every config syntax error produces noisy
				// output even when the caller wants to suppress it.
				logLevel: "silent",
			},
		});
		mod = result.mod as { default?: OpenPolicyConfig };
	} catch (err) {
		return {
			config: null,
			issues: [],
			loadError: err instanceof Error ? err : new Error(String(err)),
		};
	}

	const config = mod.default;
	if (!config) {
		return {
			config: null,
			issues: [],
			loadError: new Error(`${args.configFile} has no default export`),
		};
	}

	return {
		config,
		issues: applyIssuePolicy(validate(config), {
			strict: args.strict,
			suppress: args.suppress,
		}),
		loadError: null,
	};
}

/**
 * Formats a validation issue for terminal output. Prefixes with `[openpolicy]`
 * so users can grep the build log for our messages.
 */
export function formatIssue(issue: Issue): string {
	return `[openpolicy] ${issue.code}: ${issue.message}`;
}

/**
 * Formats a located scanner diagnostic for terminal output as
 * `[openpolicy] file:line:col code: message` — same greppable prefix as
 * {@link formatIssue}, with a clickable `file:line:col` location.
 */
export function formatScannerDiagnostic(d: ScannerDiagnostic): string {
	return `[openpolicy] ${d.file}:${d.line}:${d.column} ${d.code}: ${d.message}`;
}
