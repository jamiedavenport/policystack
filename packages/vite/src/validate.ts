import {
	expandOpenPolicyConfig,
	type OpenPolicyConfig,
	validateCookiePolicy,
	validateOpenPolicyConfig,
	validatePrivacyPolicy,
	type ValidationIssue,
} from "@openpolicy/core";
import { bundleRequire } from "bundle-require";

export type ValidatedConfig = {
	config: OpenPolicyConfig | null;
	issues: ValidationIssue[];
	loadError: Error | null;
};

/**
 * Loads the user's `openpolicy.ts` via bundle-require, then runs every
 * validator exported from `@openpolicy/core` against the resolved config.
 * The config imports its scanned values from the on-disk `./openpolicy.gen`
 * module, so bundle-require resolves them as ordinary relative source — no
 * interception shim is needed. The caller must have written `openpolicy.gen.ts`
 * (via `writeGenModule`) before calling this. Issues are deduped by
 * `code + message` because the SDK-shape validator overlaps with the
 * post-expansion privacy/cookie validators on required-field checks.
 *
 * Bundle-require errors (TS syntax errors, missing imports, runtime throws in
 * the user's config module) are surfaced as `loadError` rather than thrown so
 * the caller can decide whether to forward — TS errors should already be
 * caught by the user's type-check pipeline; we don't want to double-report.
 */
export async function loadAndValidateConfig(args: {
	configFile: string;
}): Promise<ValidatedConfig> {
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

	const issues: ValidationIssue[] = [];
	issues.push(...validateOpenPolicyConfig(config));
	for (const input of expandOpenPolicyConfig(config)) {
		if (input.type === "privacy") issues.push(...validatePrivacyPolicy(input));
		else issues.push(...validateCookiePolicy(input));
	}

	const seen = new Set<string>();
	const deduped: ValidationIssue[] = [];
	for (const issue of issues) {
		const key = `${issue.code}::${issue.message}`;
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(issue);
	}

	return {
		config,
		issues: deduped,
		loadError: null,
	};
}

/**
 * Formats a validation issue for terminal output. Prefixes with `[openpolicy]`
 * so users can grep the build log for our messages.
 */
export function formatIssue(issue: ValidationIssue): string {
	return `[openpolicy] ${issue.code}: ${issue.message}`;
}
