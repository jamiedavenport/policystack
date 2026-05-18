import { readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { glob } from "tinyglobby";
import {
	collectSdkBindings,
	createPolicyExtractor,
	makeLineLocator,
	type ScannerDiagnostic,
	type SharingEntry,
	type ThirdPartyEntry,
} from "./analyse";
import { KNOWN_COOKIE_PACKAGES, KNOWN_PACKAGES } from "./registry";
import { type CookieMap, type Scanned } from "./scanned";
import type { SdkSpecifierMatcher } from "./sdk-specifier";
import { parseFile } from "./consent/parser";
import { DEFAULT_EXCLUDE, DEFAULT_INCLUDE, defaultRules } from "./consent/scan";
import { applySuppressions } from "./consent/suppress";
import { CONSENT_REGISTRY } from "./registry";
import { makePolicyStackRule } from "./consent/rules/policystack";
import type {
	Cookie,
	Hit,
	ParsedFile,
	Rule,
	ScanResult,
	Ungated,
	VendorHit,
} from "./consent/types";
import { walk } from "./consent/visit";

// Recursively-skipped directory basenames for *policy* scoping — mirrors the
// legacy `walkSources` DEFAULT_IGNORES so the gen module's input set (and its
// FROZEN merge order) is unchanged by the move to one project-wide discovery.
const POLICY_IGNORE_DIRS: ReadonlySet<string> = new Set([
	"node_modules",
	"dist",
	".git",
	".next",
	".output",
	".svelte-kit",
	".cache",
]);

export type UnifiedScanOptions = {
	root: string;
	/** Absolute resolved policy source dir (gen module + policy scoping). */
	srcDir: string;
	/** Policy file extensions, e.g. `[".ts", ".tsx"]`. */
	extensions: string[];
	/** Extra ignored directory basenames for policy scoping. */
	ignore: string[];
	/** Absolute path of `policystack.gen.ts` (never a policy input). */
	genFile: string | null;
	/** Whether the consent rule set runs (the `consent` plugin option). */
	consentEnabled: boolean;
	consentInclude?: string[];
	consentExclude?: string[];
	usePackageJson: boolean;
	useCookiesPackageJson: boolean;
	sdkMatcher: SdkSpecifierMatcher;
	prewarm: (specifiers: Iterable<string>) => Promise<void>;
};

export type UnifiedScanResult = {
	scanned: Scanned;
	consent: ScanResult;
};

export type UnifiedScanner = {
	/** Full project scan: one discovery, one parse + one walk per file. */
	fullScan: () => Promise<UnifiedScanResult>;
	/** Dev: re-scan one file's consent findings, returning the ungated delta. */
	rescanFileConsent: (file: string) => Promise<{ prev: Ungated[]; next: Ungated[] } | null>;
	/** Last full consent result (for the `buildEnd` ungated throw). */
	lastConsent: () => ScanResult | undefined;
	/** True for files the consent dev watcher should react to. */
	isConsentRelevant: (file: string) => boolean;
};

function orderHits(
	a: { file: string; line: number; column: number },
	b: { file: string; line: number; column: number },
): number {
	if (a.file !== b.file) return a.file.localeCompare(b.file);
	if (a.line !== b.line) return a.line - b.line;
	return a.column - b.column;
}

function orderUngated(a: Ungated, b: Ungated): number {
	return a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file);
}

export function createUnifiedScanner(opts: UnifiedScanOptions): UnifiedScanner {
	const include = opts.consentInclude ?? DEFAULT_INCLUDE;
	const exclude = opts.consentExclude ?? DEFAULT_EXCLUDE;
	const policyIgnore = new Set<string>([...POLICY_IGNORE_DIRS, ...opts.ignore]);

	// Per-file consent index, kept fresh across fullScan + dev rescans so the
	// `buildEnd` throw and dev deltas see consistent state (ported verbatim
	// from the old ConsentRunner).
	let lastConsent: ScanResult | undefined;
	const ungatedByFile = new Map<string, Ungated[]>();
	const cookiesByFile = new Map<string, Hit[]>();
	const vendorsByFile = new Map<string, Hit[]>();

	function push<T>(map: Map<string, T[]>, key: string, value: T): void {
		const arr = map.get(key);
		if (arr) arr.push(value);
		else map.set(key, [value]);
	}

	function indexResult(result: ScanResult): void {
		ungatedByFile.clear();
		cookiesByFile.clear();
		vendorsByFile.clear();
		for (const u of result.ungated) push(ungatedByFile, u.hit.file, u);
		for (const c of result.cookies) push(cookiesByFile, c.file, c);
		for (const v of result.vendors) push(vendorsByFile, v.file, v);
	}

	function isPolicyTracked(file: string): boolean {
		if (opts.genFile && file === opts.genFile) return false;
		const rel = relative(opts.srcDir, file);
		if (!rel || rel.startsWith("..")) return false;
		if (!opts.extensions.some((ext) => file.endsWith(ext))) return false;
		for (const segment of rel.split(sep)) {
			if (policyIgnore.has(segment)) return false;
		}
		return true;
	}

	function isConsentRelevant(file: string): boolean {
		return /\.(?:[mc]?[jt]sx?|vue|svelte)$/.test(file);
	}

	async function readPackageJsonDeps(): Promise<Record<string, string>> {
		let raw: string;
		try {
			raw = await readFile(resolve(opts.root, "package.json"), "utf8");
		} catch {
			return {};
		}
		let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
		try {
			pkg = JSON.parse(raw) as typeof pkg;
		} catch {
			return {};
		}
		return { ...pkg.dependencies, ...pkg.devDependencies };
	}

	// Parse + walk a single file. Returns the consent hits/ungated for it and,
	// when the file is a policy input, its merged per-file ExtractResult.
	function scanOne(
		file: string,
		source: string,
	): {
		cookies: Cookie[];
		vendors: VendorHit[];
		ungated: Ungated[];
		policy?: ReturnType<ReturnType<typeof createPolicyExtractor>["result"]>;
	} | null {
		let parsed: ParsedFile | null;
		try {
			parsed = parseFile(file, source);
		} catch {
			return null;
		}
		if (!parsed) return null;

		const rules: Rule[] = [];
		if (opts.consentEnabled) rules.push(...defaultRules);

		const policyEligible = isPolicyTracked(file);
		let extractor: ReturnType<typeof createPolicyExtractor> | undefined;
		if (policyEligible) {
			const bindings = collectSdkBindings(parsed.ast, opts.sdkMatcher);
			const base = makeLineLocator(parsed.source);
			const lineOffset = parsed.lineOffset;
			const locate =
				lineOffset === 0
					? base
					: (offset: number) => {
							const p = base(offset);
							return { line: p.line + lineOffset, column: p.column };
						};
			extractor = createPolicyExtractor({ filename: file, bindings, locate });
			rules.push(makePolicyStackRule(extractor));
		}

		if (rules.length === 0) return { cookies: [], vendors: [], ungated: [] };

		const result = walk(parsed, rules, CONSENT_REGISTRY);
		const filtered = applySuppressions(result.hits, parsed.comments);
		const kept = new Set(filtered);
		const cookies: Cookie[] = [];
		const vendors: VendorHit[] = [];
		for (const h of filtered) {
			if ("kind" in h) cookies.push(h);
			else vendors.push(h);
		}
		const ungated = result.ungated.filter((u) => kept.has(u.hit));
		return { cookies, vendors, ungated, policy: extractor?.result() };
	}

	async function fullScan(): Promise<UnifiedScanResult> {
		const files = await glob(include, {
			cwd: opts.root,
			ignore: exclude,
			absolute: true,
			onlyFiles: true,
			dot: false,
		});

		// Phase 1: read + parse once; collect the SDK import-specifier union
		// from policy inputs so the resolver pre-warms in one batch.
		type Loaded = { file: string; source: string };
		const loaded: Loaded[] = [];
		const importSources = new Set<string>();
		for (const file of files) {
			const policyTracked = isPolicyTracked(file);
			// When consent is off the gen module is the only consumer, so only
			// touch policy inputs — keeps the policy-only path as cheap as the
			// legacy srcDir walk.
			if (!opts.consentEnabled && !policyTracked) continue;
			let source: string;
			try {
				source = await readFile(file, "utf8");
			} catch {
				continue;
			}
			loaded.push({ file, source });
			if (policyTracked) {
				try {
					const parsed = parseFile(file, source);
					if (parsed) for (const s of parsed.importSources) importSources.add(s);
				} catch {
					// unparsable — skipped consistently in phase 2 too
				}
			}
		}
		await opts.prewarm(importSources);

		// Phase 2: one walk per file. Consent hits accrue project-wide; policy
		// inputs are merged in the FROZEN lexicographic order.
		const cookies: Cookie[] = [];
		const vendors: VendorHit[] = [];
		const ungated: Ungated[] = [];
		const policyByFile = new Map<string, NonNullable<ReturnType<typeof scanOne>>["policy"]>();

		for (const { file, source } of loaded) {
			const r = scanOne(file, source);
			if (!r) continue;
			for (const c of r.cookies) cookies.push(c);
			for (const v of r.vendors) vendors.push(v);
			for (const u of r.ungated) ungated.push(u);
			if (r.policy) policyByFile.set(file, r.policy);
		}

		// Merge policy per-file results — same dedup + ordering as the legacy
		// scanAndMerge (FROZEN 1.0 contract: lexicographic absolute-path order).
		const policyFiles = [...policyByFile.keys()].sort();
		const mergedData: Record<string, string[]> = {};
		const mergedParties: ThirdPartyEntry[] = [];
		const seenParties = new Set<string>();
		const cookieSet = new Set<string>();
		const mergedSharing: SharingEntry[] = [];
		const seenSharing = new Set<string>();
		const diagnostics: ScannerDiagnostic[] = [];
		for (const file of policyFiles) {
			const extracted = policyByFile.get(file);
			if (!extracted) continue;
			for (const d of extracted.diagnostics) diagnostics.push(d);
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
			for (const edge of extracted.sharing) {
				const dedup = JSON.stringify([edge.key, edge.recipient]);
				if (seenSharing.has(dedup)) continue;
				seenSharing.add(dedup);
				mergedSharing.push(edge);
			}
		}

		if (opts.usePackageJson) {
			const deps = await readPackageJsonDeps();
			const seenNames = new Set<string>();
			for (const pkgName of Object.keys(deps)) {
				const entry = KNOWN_PACKAGES.get(pkgName);
				if (entry && !seenNames.has(entry.name) && !seenParties.has(entry.name)) {
					seenNames.add(entry.name);
					seenParties.add(entry.name);
					mergedParties.push(entry);
				}
			}
		}
		if (opts.useCookiesPackageJson) {
			const deps = await readPackageJsonDeps();
			for (const pkgName of Object.keys(deps)) {
				const cats = KNOWN_COOKIE_PACKAGES.get(pkgName);
				if (!cats) continue;
				for (const cat of cats) cookieSet.add(cat);
			}
		}

		const cookieMap: CookieMap = { essential: true };
		for (const cat of cookieSet) {
			if (cat === "essential") continue;
			cookieMap[cat] = true;
		}

		cookies.sort(orderHits);
		vendors.sort(orderHits);
		ungated.sort(orderUngated);
		const consent: ScanResult = { cookies, vendors, ungated };
		lastConsent = consent;
		indexResult(consent);

		return {
			scanned: {
				dataCollected: mergedData,
				thirdParties: mergedParties,
				cookies: cookieMap,
				sharing: mergedSharing,
				diagnostics,
			},
			consent,
		};
	}

	function rebuildConsent(): ScanResult {
		const cookies: Cookie[] = [];
		const vendors: VendorHit[] = [];
		const ung: Ungated[] = [];
		for (const arr of cookiesByFile.values()) for (const h of arr) if ("kind" in h) cookies.push(h);
		for (const arr of vendorsByFile.values())
			for (const h of arr) if (!("kind" in h)) vendors.push(h);
		for (const arr of ungatedByFile.values()) ung.push(...arr);
		cookies.sort(orderHits);
		vendors.sort(orderHits);
		ung.sort(orderUngated);
		return { cookies, vendors, ungated: ung };
	}

	async function rescanFileConsent(
		file: string,
	): Promise<{ prev: Ungated[]; next: Ungated[] } | null> {
		if (!opts.consentEnabled) return null;
		if (!isConsentRelevant(file)) return null;
		let source: string;
		try {
			source = await readFile(file, "utf8");
		} catch {
			return null;
		}
		const r = scanOne(file, source);
		if (!r) return null;
		const prev = ungatedByFile.get(file) ?? [];

		const fileCookies = r.cookies as Hit[];
		const fileVendors = r.vendors as Hit[];
		if (fileCookies.length === 0 && fileVendors.length === 0) {
			cookiesByFile.delete(file);
			vendorsByFile.delete(file);
		} else {
			cookiesByFile.set(file, fileCookies);
			vendorsByFile.set(file, fileVendors);
		}
		if (r.ungated.length === 0) ungatedByFile.delete(file);
		else ungatedByFile.set(file, r.ungated);

		lastConsent = rebuildConsent();
		return { prev, next: r.ungated };
	}

	return {
		fullScan,
		rescanFileConsent,
		lastConsent: () => lastConsent,
		isConsentRelevant,
	};
}
