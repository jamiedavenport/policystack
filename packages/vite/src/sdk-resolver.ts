import {
	CANONICAL_SDK_SPECIFIERS,
	isCanonicalSdkSpecifier,
	type SdkSpecifierMatcher,
} from "./sdk-specifier";

/**
 * Minimal slice of Vite/Rollup's `PluginContext.resolve`. The plugin adapts
 * `this.resolve(source, importer, {})` to this shape; `null` means the
 * specifier didn't resolve (alias typo, SDK not installed, etc.).
 */
export type ResolveId = (source: string, importer: string) => Promise<{ id: string } | null>;

/**
 * A resolver-backed SDK matcher plus its batch pre-warm step. The plugin
 * calls {@link SdkMatcher.prewarm} once per scan with the union of every
 * file's import specifiers, then consults the synchronous {@link
 * SdkMatcher.match} during extraction (extraction stays sync; resolution,
 * which is async, has already happened).
 */
export type SdkMatcher = {
	match: SdkSpecifierMatcher;
	prewarm(specifiers: Iterable<string>): Promise<void>;
};

/**
 * Strip a Vite/Rollup resolved id down to a stable comparison key: drop the
 * `?v=`/`?t=`/`?import` query and `#fragment` suffixes dev adds, and
 * normalise Windows separators. Both the canonical SDK id and every
 * candidate id pass through this before comparison.
 */
function normaliseId(id: string): string {
	const noQuery = id.split("?", 1)[0] ?? id;
	const noHash = noQuery.split("#", 1)[0] ?? noQuery;
	return noHash.replace(/\\/g, "/");
}

/**
 * Build the SDK matcher used by the Vite plugin.
 *
 * Resolves the canonical specifiers once (via the user's project, see
 * `importer`) to learn the SDK's resolved *root* module id. A candidate
 * specifier is the SDK iff it's a canonical specifier (so the
 * `@openpolicy/` → `@policystack/` rename and the no-resolver path keep
 * working) **or** it resolves to exactly that root id (so aliases resolve;
 * subpaths like `@openpolicy/sdk/foo` resolve to a *different* id and are
 * correctly rejected — the tracked exports are root-only).
 *
 * Falls back to the pure dual-scope predicate when there's no resolver or the
 * canonical specifier itself can't be resolved (SDK not installed). The
 * fallback is strictly more conservative than literal matching; because
 * silently dropping privacy data is never acceptable, `warn` is called once
 * so an aliased-but-undetectable SDK setup is visible in the build/dev log.
 */
export async function createSdkMatcher(args: {
	resolve: ResolveId | null;
	importer: string;
	warn: (msg: string) => void;
}): Promise<SdkMatcher> {
	const { resolve, importer, warn } = args;

	const fallback: SdkMatcher = {
		match: isCanonicalSdkSpecifier,
		prewarm: async () => {},
	};

	if (!resolve) return fallback;

	const sdkRootIds = new Set<string>();
	for (const spec of CANONICAL_SDK_SPECIFIERS) {
		try {
			const resolved = await resolve(spec, importer);
			if (resolved) sdkRootIds.add(normaliseId(resolved.id));
		} catch {
			// Treat a throwing resolver like an unresolvable specifier.
		}
	}

	if (sdkRootIds.size === 0) {
		warn(
			"[policystack] could not resolve the SDK via the Vite resolver; " +
				"falling back to literal specifier matching — aliased SDK imports " +
				"will not be detected.",
		);
		return fallback;
	}

	// specifier → is-SDK. Persists for the plugin instance, so dev rescans
	// never re-resolve an already-seen specifier.
	const memo = new Map<string, boolean>();

	const match: SdkSpecifierMatcher = (specifier) =>
		isCanonicalSdkSpecifier(specifier) || memo.get(specifier) === true;

	const prewarm = async (specifiers: Iterable<string>): Promise<void> => {
		const pending: string[] = [];
		for (const specifier of specifiers) {
			if (isCanonicalSdkSpecifier(specifier)) continue;
			if (memo.has(specifier)) continue;
			memo.set(specifier, false); // claim it so the batch resolves each once
			pending.push(specifier);
		}
		await Promise.all(
			pending.map(async (specifier) => {
				try {
					const resolved = await resolve(specifier, importer);
					if (resolved && sdkRootIds.has(normaliseId(resolved.id))) {
						memo.set(specifier, true);
					}
				} catch {
					// Leave the claimed `false` — an unresolvable specifier is not the SDK.
				}
			}),
		);
	};

	return { match, prewarm };
}
