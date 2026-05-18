import { parseSync } from "oxc-parser";
import { isCanonicalSdkSpecifier, type SdkSpecifierMatcher } from "./sdk-specifier";

const COLLECTING_NAME = "collecting";
const THIRD_PARTY_NAME = "thirdParty";
const IGNORE_NAME = "Ignore";
const DEFINE_COOKIE_NAME = "defineCookie";
const SHARING_NAME = "sharing";

type AnyNode = { type: string; [key: string]: unknown };

export type ThirdPartyEntry = {
	name: string;
	purpose: string;
	policyUrl: string;
};

/**
 * One scanned `sharing(key, recipient, value)` edge: the personal-data
 * category (`key`) that leaves to `recipient`. The data-flow edge powering the
 * CCPA/CPRA sell/share posture and the §4.3 declared-vs-used cross-check —
 * distinct from {@link ThirdPartyEntry}, which is only the vendor declaration.
 */
export type SharingEntry = {
	key: string;
	recipient: string;
};

/**
 * Reason a *recognized* `collecting` / `thirdParty` / `defineCookie` call was
 * skipped instead of contributing data. These codes surface in build/dev logs
 * and are public API at 1.0 — keep the union narrow and the meanings stable.
 */
export type ScannerSkipCode =
	| "missing-arguments" //        call has fewer args than the SDK function requires
	| "non-literal-argument" //     a string-literal-expected arg isn't a string literal
	| "non-object-label-map" //     collecting() 3rd arg isn't an object literal
	| "spread-in-label-map" //      spread element inside collecting()'s label object
	| "non-literal-label-value"; // a label value is neither a string literal nor Ignore

/**
 * A located build warning emitted for a recognized-but-unreadable call, so
 * statically invisible privacy data never disappears silently. `line` and
 * `column` are 1-based and point at the call expression.
 */
export type ScannerDiagnostic = {
	code: ScannerSkipCode;
	message: string;
	file: string;
	line: number;
	column: number;
};

type RecordFn = (code: ScannerSkipCode, message: string, node: AnyNode | undefined) => void;

type ExtractResult = {
	dataCollected: Record<string, string[]>;
	thirdParties: ThirdPartyEntry[];
	cookies: string[];
	sharing: SharingEntry[];
	diagnostics: ScannerDiagnostic[];
};

function emptyResult(): ExtractResult {
	return { dataCollected: {}, thirdParties: [], cookies: [], sharing: [], diagnostics: [] };
}

/**
 * A successfully parsed module plus the metadata the scan pipeline needs
 * before deciding SDK-ness. `importSources` is the de-duplicated set of
 * non-type `import … from "<source>"` specifier strings — the Vite plugin
 * resolves these through the Vite resolver to learn which (possibly aliased)
 * specifiers point at the SDK before extraction runs.
 */
export type ParsedModule = {
	program: AnyNode;
	code: string;
	filename: string;
	importSources: string[];
};

/**
 * Parse a single source file with oxc. Returns `null` on a hard parse
 * failure (oxc still produces a usable AST for recoverable errors, so those
 * are kept). Also collects the distinct non-type import source specifiers so
 * the caller can resolve them once, in batch, before extraction.
 */
export function parseModule(filename: string, code: string): ParsedModule | null {
	let result: ReturnType<typeof parseSync>;
	try {
		result = parseSync(filename, code);
	} catch {
		console.warn(`[policystack] parse error in ${filename}`);
		return null;
	}

	if (result.errors.length > 0) {
		// Hard parse failures only — oxc reports recoverable errors but still
		// produces a usable AST, so we keep going and let the walker decide.
		const fatal = result.errors.some((e) => e.severity === ("Error" as never));
		if (fatal) {
			console.warn(`[policystack] parse error in ${filename}`);
			return null;
		}
	}

	const program = result.program as unknown as AnyNode;
	return { program, code, filename, importSources: collectImportSources(program) };
}

/**
 * Distinct, non-type `import … from "<source>"` specifier strings in program
 * order. Type-only declarations are skipped — they can't carry runtime SDK
 * calls, so there's no point resolving them.
 */
function collectImportSources(program: AnyNode): string[] {
	const seen = new Set<string>();
	const body = program.body as AnyNode[] | undefined;
	if (!body) return [];
	for (const node of body) {
		if (node.type !== "ImportDeclaration") continue;
		if ((node.importKind as string | undefined) === "type") continue;
		const source = node.source as AnyNode | undefined;
		if (source && typeof source.value === "string") seen.add(source.value);
	}
	return [...seen];
}

/**
 * Extract `collecting()`, `thirdParty()`, `defineCookie()`, and `sharing()`
 * call metadata from a single source file.
 *
 * Returns an `ExtractResult` with `dataCollected` (category → labels),
 * `thirdParties` (array of third-party entries), `cookies` (array of
 * category names), `sharing` (array of key → recipient edges), and
 * `diagnostics` — one located warning for every recognized call that couldn't
 * be read statically (so no recognized call is ever dropped silently). Files
 * with no matching calls — or that fail to parse — return empty defaults.
 *
 * `isSdkSpecifier` decides whether an import source is the SDK. It defaults
 * to {@link isCanonicalSdkSpecifier} (exact dual-scope match) so direct
 * `@policystack/sdk` / `@policystack/sdk` imports work with no resolver; the
 * Vite plugin swaps in a resolver-backed predicate so import aliases also
 * resolve.
 */
export function extractFromFile(
	filename: string,
	code: string,
	isSdkSpecifier: SdkSpecifierMatcher = isCanonicalSdkSpecifier,
): ExtractResult {
	const parsed = parseModule(filename, code);
	if (!parsed) return emptyResult();
	return extractFromParsed(parsed, isSdkSpecifier);
}

/**
 * Extract call metadata from an already-parsed module. The scan pipeline
 * parses every file once ({@link parseModule}), resolves the union of
 * `importSources`, then calls this with a resolver-backed predicate — so
 * parsing happens exactly once per file.
 *
 * Runs in two phases:
 * 1. Collect local names bound to `collecting` / `thirdParty` / `defineCookie`
 *    / `sharing` imported from an SDK specifier (handles renamed imports, skips
 *    type-only imports, ignores look-alikes from other modules).
 * 2. Walk the program body and inspect `CallExpression` nodes whose target
 *    is one of those tracked local names.
 */
export function extractFromParsed(
	parsed: ParsedModule,
	isSdkSpecifier: SdkSpecifierMatcher,
): ExtractResult {
	const { program, code, filename } = parsed;
	const bindings = collectSdkBindings(program, isSdkSpecifier);
	if (
		bindings.collecting.size === 0 &&
		bindings.thirdParty.size === 0 &&
		bindings.defineCookie.size === 0 &&
		bindings.sharing.size === 0
	)
		return emptyResult();
	const extractor = createPolicyExtractor({
		filename,
		bindings,
		locate: makeLineLocator(code),
	});
	walk(program, (node) => extractor.visit(node));
	return extractor.result();
}

/**
 * The local names a module binds to each tracked `@policystack/sdk` export.
 * Resolved once per file by {@link collectSdkBindings} so the single unified
 * walk (PS-25) and the legacy {@link extractFromParsed} share one binding
 * pass instead of five.
 */
export type SdkBindings = {
	collecting: Set<string>;
	thirdParty: Set<string>;
	defineCookie: Set<string>;
	sharing: Set<string>;
	ignore: Set<string>;
};

/**
 * Walk the import declarations once and bucket every local name by which
 * tracked SDK export it binds (one pass for all five, instead of five
 * separate scans). Skips type-only imports and non-SDK sources.
 */
export function collectSdkBindings(
	program: AnyNode,
	isSdkSpecifier: SdkSpecifierMatcher,
): SdkBindings {
	const out: SdkBindings = {
		collecting: new Set<string>(),
		thirdParty: new Set<string>(),
		defineCookie: new Set<string>(),
		sharing: new Set<string>(),
		ignore: new Set<string>(),
	};
	const byExport: Record<string, Set<string>> = {
		[COLLECTING_NAME]: out.collecting,
		[THIRD_PARTY_NAME]: out.thirdParty,
		[DEFINE_COOKIE_NAME]: out.defineCookie,
		[SHARING_NAME]: out.sharing,
		[IGNORE_NAME]: out.ignore,
	};
	const body = program.body as AnyNode[] | undefined;
	if (!body) return out;
	for (const node of body) {
		if (node.type !== "ImportDeclaration") continue;
		if ((node.importKind as string | undefined) === "type") continue;
		const source = node.source as AnyNode | undefined;
		if (!source || typeof source.value !== "string" || !isSdkSpecifier(source.value)) continue;
		const specifiers = node.specifiers as AnyNode[] | undefined;
		if (!specifiers) continue;
		for (const spec of specifiers) {
			if (spec.type !== "ImportSpecifier") continue;
			if ((spec.importKind as string | undefined) === "type") continue;
			const imported = spec.imported as AnyNode | undefined;
			if (!imported) continue;
			const importedName =
				imported.type === "Identifier"
					? (imported.name as string | undefined)
					: imported.type === "Literal"
						? typeof imported.value === "string"
							? imported.value
							: undefined
						: undefined;
			if (importedName === undefined) continue;
			const bucket = byExport[importedName];
			if (!bucket) continue;
			const local = spec.local as AnyNode | undefined;
			if (!local || local.type !== "Identifier") continue;
			bucket.add(local.name as string);
		}
	}
	return out;
}

export type PolicyExtractor = {
	/** Inspect one AST node; accumulates `collecting`/`thirdParty`/etc. */
	visit: (node: AnyNode) => void;
	/** The merged per-file result after the walk has visited every node. */
	result: () => ExtractResult;
};

/**
 * The shared policy-extraction algorithm, decoupled from the traversal so it
 * can be driven by the single unified walk (PS-25) *or* the legacy
 * {@link extractFromParsed}. `locate` maps a node offset to a 1-based
 * line/column — pass {@link makeLineLocator} for plain modules, or an
 * SFC-offset-aware locator so Vue/Svelte policy diagnostics point at the
 * right source line.
 */
export function createPolicyExtractor(args: {
	filename: string;
	bindings: SdkBindings;
	locate: (offset: number) => { line: number; column: number };
}): PolicyExtractor {
	const { filename, bindings, locate } = args;
	const dataCollected: Record<string, string[]> = {};
	const thirdParties: ThirdPartyEntry[] = [];
	const seenThirdParties = new Set<string>();
	const cookieSet = new Set<string>();
	const sharing: SharingEntry[] = [];
	const seenSharing = new Set<string>();
	const diagnostics: ScannerDiagnostic[] = [];
	const record: RecordFn = (skipCode, message, node) => {
		const offset = node && typeof node.start === "number" ? (node.start as number) : 0;
		const { line, column } = locate(offset);
		diagnostics.push({ code: skipCode, message, file: filename, line, column });
	};

	function visit(node: AnyNode): void {
		if (node.type !== "CallExpression") return;
		const callee = node.callee as AnyNode | undefined;
		const args2 = node.arguments as AnyNode[] | undefined;

		if (!callee || callee.type !== "Identifier") return;
		const calleeName = callee.name as string;

		if (bindings.collecting.has(calleeName)) {
			if (!args2 || args2.length < 3) {
				record(
					"missing-arguments",
					"collecting() requires 3 arguments (category, value, labels)",
					node,
				);
				return;
			}
			const category = extractStringLiteral(args2[0]);
			if (category === null) {
				record("non-literal-argument", "collecting() category must be a string literal", node);
				return;
			}
			const labels = extractLabelKeys(args2[2], bindings.ignore, node, record);
			if (labels === null) {
				record(
					"non-object-label-map",
					"collecting() labels (3rd argument) must be an object literal",
					node,
				);
				return;
			}
			const existing = dataCollected[category] ?? [];
			const seen = new Set(existing);
			for (const label of labels) {
				if (!seen.has(label)) {
					existing.push(label);
					seen.add(label);
				}
			}
			dataCollected[category] = existing;
			return;
		}

		if (bindings.thirdParty.has(calleeName)) {
			if (!args2 || args2.length < 3) {
				record(
					"missing-arguments",
					"thirdParty() requires 3 arguments (name, purpose, policyUrl)",
					node,
				);
				return;
			}
			const name = extractStringLiteral(args2[0]);
			if (name === null) {
				record("non-literal-argument", "thirdParty() name must be a string literal", node);
				return;
			}
			const purpose = extractStringLiteral(args2[1]);
			if (purpose === null) {
				record("non-literal-argument", "thirdParty() purpose must be a string literal", node);
				return;
			}
			const policyUrl = extractStringLiteral(args2[2]);
			if (policyUrl === null) {
				record("non-literal-argument", "thirdParty() policyUrl must be a string literal", node);
				return;
			}
			// Within-file duplicate of an already-captured entry — intentional
			// dedup, the data is not lost, so no diagnostic.
			if (seenThirdParties.has(name)) return;
			seenThirdParties.add(name);
			thirdParties.push({ name, purpose, policyUrl });
			return;
		}

		if (bindings.defineCookie.has(calleeName)) {
			if (!args2 || args2.length < 1) {
				record("missing-arguments", "defineCookie() requires 1 argument (category)", node);
				return;
			}
			const category = extractStringLiteral(args2[0]);
			if (category === null) {
				record("non-literal-argument", "defineCookie() category must be a string literal", node);
				return;
			}
			cookieSet.add(category);
			return;
		}

		if (bindings.sharing.has(calleeName)) {
			if (!args2 || args2.length < 3) {
				record("missing-arguments", "sharing() requires 3 arguments (key, recipient, value)", node);
				return;
			}
			const key = extractStringLiteral(args2[0]);
			if (key === null) {
				record("non-literal-argument", "sharing() key must be a string literal", node);
				return;
			}
			const recipient = extractStringLiteral(args2[1]);
			if (recipient === null) {
				record("non-literal-argument", "sharing() recipient must be a string literal", node);
				return;
			}
			// args[2] is the payload — returned unchanged at runtime, never read
			// statically (same as collecting()'s value argument).
			// Within-file duplicate of an already-captured edge — intentional
			// dedup, the data is not lost, so no diagnostic. JSON tuple key so
			// a space in either string can't alias a different (key, recipient).
			const dedup = JSON.stringify([key, recipient]);
			if (seenSharing.has(dedup)) return;
			seenSharing.add(dedup);
			sharing.push({ key, recipient });
		}
	}

	function result(): ExtractResult {
		return { dataCollected, thirdParties, cookies: [...cookieSet], sharing, diagnostics };
	}

	return { visit, result };
}

/**
 * If `node` is a string `Literal`, return its string value. Otherwise
 * return `null` so the caller can record a diagnostic and skip the call.
 */
function extractStringLiteral(node: AnyNode | undefined): string | null {
	if (!node) return null;
	if (node.type !== "Literal") return null;
	if (typeof node.value !== "string") return null;
	return node.value;
}

/**
 * Best-effort property key name (`{ name: ... }` → `"name"`) for diagnostic
 * messages. Returns `null` for computed/non-trivial keys.
 */
function propKeyName(prop: AnyNode): string | null {
	const key = prop.key as AnyNode | undefined;
	if (!key) return null;
	if (key.type === "Identifier" && typeof key.name === "string") return key.name;
	if (key.type === "Literal" && typeof key.value === "string") return key.value;
	return null;
}

/**
 * Extract the string values from a plain `{ fieldName: "Human Label" }`
 * object literal. Returns an array of label strings, deduped while
 * preserving insertion order. Returns `null` if the node isn't an object
 * literal so the caller can report `non-object-label-map`.
 *
 * Properties whose value is an `Identifier` bound to the SDK's `Ignore`
 * export are explicit opt-outs and skipped without a diagnostic. Spread
 * elements and any other non-string-literal value are *recognized but
 * unreadable*, so each records a located diagnostic (`spread-in-label-map`
 * / `non-literal-label-value`) against the call before being dropped.
 */
function extractLabelKeys(
	node: AnyNode | undefined,
	ignoreNames: Set<string>,
	callNode: AnyNode,
	record: RecordFn,
): string[] | null {
	if (!node || node.type !== "ObjectExpression") return null;
	const properties = node.properties as AnyNode[] | undefined;
	if (!properties) return null;

	const labels: string[] = [];
	const seen = new Set<string>();
	for (const prop of properties) {
		if (prop.type !== "Property") {
			// SpreadElement: the labels behind the spread can't be read statically.
			record(
				"spread-in-label-map",
				"collecting() label object uses a spread; spread labels can't be read statically",
				callNode,
			);
			continue;
		}
		const val = prop.value as AnyNode | undefined;
		if (!val) continue;
		if (val.type === "Literal" && typeof val.value === "string") {
			// Duplicate label string — already captured, intentional dedup.
			if (seen.has(val.value)) continue;
			seen.add(val.value);
			labels.push(val.value);
			continue;
		}
		if (
			val.type === "Identifier" &&
			typeof val.name === "string" &&
			ignoreNames.has(val.name as string)
		) {
			// Explicit `Ignore` opt-out — intentional, not data loss.
			continue;
		}
		const field = propKeyName(prop);
		record(
			"non-literal-label-value",
			`collecting() label ${field ? `"${field}" ` : ""}value must be a string literal or Ignore`,
			callNode,
		);
	}
	return labels;
}

/**
 * Build a memoized offset → 1-based `{ line, column }` resolver for `code`.
 * The newline index is computed once on first use (diagnostics are rare, so
 * files with no skipped calls never pay for it).
 */
export function makeLineLocator(
	code: string,
): (offset: number) => { line: number; column: number } {
	let cached: number[] | null = null;
	const lineStartsFor = (): number[] => {
		if (cached) return cached;
		const starts = [0];
		for (let i = 0; i < code.length; i++) {
			if (code.charCodeAt(i) === 10 /* \n */) starts.push(i + 1);
		}
		cached = starts;
		return starts;
	};
	return (offset) => {
		const starts = lineStartsFor();
		let lo = 0;
		let hi = starts.length - 1;
		while (lo < hi) {
			const mid = (lo + hi + 1) >> 1;
			if ((starts[mid] ?? 0) <= offset) lo = mid;
			else hi = mid - 1;
		}
		return { line: lo + 1, column: offset - (starts[lo] ?? 0) + 1 };
	};
}

/**
 * Recursive AST walker. Visits every `AnyNode` (depth-first) reachable
 * through array / nested-object children and invokes `visit` on each.
 */
function walk(node: AnyNode, visit: (node: AnyNode) => void): void {
	visit(node);
	for (const key of Object.keys(node)) {
		if (key === "parent") continue;
		const value = node[key];
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item && typeof item === "object" && typeof item.type === "string") {
					walk(item as AnyNode, visit);
				}
			}
		} else if (
			value &&
			typeof value === "object" &&
			typeof (value as { type?: unknown }).type === "string"
		) {
			walk(value as AnyNode, visit);
		}
	}
}
