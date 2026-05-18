import { relative } from "node:path";
import type { Cookie, Hit, ScanResult, Ungated, VendorHit } from "./types";

/**
 * Build → fail (`buildEnd` throws); serve → warn; `off` → consent scan is
 * skipped entirely. Omitting the `consent` option leaves the scan off.
 */
export type Mode = "warn" | "error" | "off";

export type Logger = {
	info: (msg: string) => void;
	warn: (msg: string) => void;
	error: (msg: string) => void;
};

const PREFIX = "[policystack]";

const FIX_HINTS: Record<string, string> = {
	"vendor-imports":
		'wrap call sites in <ConsentGate category="…"> or guard with store.has("category")',
	"document-cookie": "set the cookie inside a setter that checks consent first",
	"js-cookie": 'guard Cookies.set behind store.has("category")',
	"cookies-next": 'guard setCookie/deleteCookie behind store.has("category")',
	"react-cookie": "call setCookie inside a handler that checks consent first",
	"next-headers":
		"set cookies only on responses for routes that require consent (or behind a server-side gate)",
	"set-cookie-header": "only attach Set-Cookie when the requesting category is granted",
};

export function formatHitLocation(hit: Hit, root: string): string {
	const rel = toRel(hit.file, root);
	return `${rel}:${hit.line}:${hit.column}`;
}

function toRel(file: string, root: string): string {
	const r = relative(root, file);
	return r === "" || r.startsWith("..") ? file : r;
}

function describeHit(hit: Hit): string {
	if ("kind" in hit) {
		const named = hit.name ? ` "${hit.name}"` : "";
		return `cookie write${named} via ${hit.kind}`;
	}
	return `${hit.vendor} (${hit.category}) call via ${hit.via}`;
}

function ruleNameFor(hit: Hit): string {
	if ("kind" in hit) return hit.kind;
	return "vendor-imports";
}

export function formatUngated(u: Ungated, root: string): string {
	const loc = formatHitLocation(u.hit, root);
	const rule = ruleNameFor(u.hit);
	const fix = FIX_HINTS[rule] ?? "wrap the call in a consent gate";
	return [
		`${PREFIX} ungated ${describeHit(u.hit)} at ${loc}`,
		`  Rule: ${rule}`,
		`  Fix: ${fix}`,
		`  Suppress: // policystack-ignore-next-line`,
	].join("\n");
}

export function formatSummary(result: ScanResult): string {
	const { cookies, vendors, ungated } = result;
	return `${PREFIX} ${cookies.length} cookies, ${vendors.length} vendors, ${ungated.length} ungated`;
}

export function report(
	result: ScanResult,
	logger: Logger,
	opts: { mode: Mode; root: string },
): void {
	if (opts.mode === "off") return;
	const log = opts.mode === "error" ? logger.error : logger.warn;
	for (const u of result.ungated) {
		log(formatUngated(u, opts.root));
	}
	if (result.ungated.length > 0) log("");
	logger.info(formatSummary(result));
}

export function reportFileDelta(
	prevForFile: Ungated[],
	nextForFile: Ungated[],
	logger: Logger,
	opts: { mode: Mode; root: string; file: string },
): void {
	if (opts.mode === "off") return;
	const log = opts.mode === "error" ? logger.error : logger.warn;
	const prevKeys = new Set(prevForFile.map(keyForUngated));
	const nextKeys = new Set(nextForFile.map(keyForUngated));
	const added = nextForFile.filter((u) => !prevKeys.has(keyForUngated(u)));
	const removed = prevForFile.filter((u) => !nextKeys.has(keyForUngated(u)));
	for (const u of added) log(formatUngated(u, opts.root));
	if (removed.length > 0) {
		const rel = toRel(opts.file, opts.root);
		logger.info(`${PREFIX} ${removed.length} ungated finding(s) cleared in ${rel}`);
	}
}

function keyForUngated(u: Ungated): string {
	const h = u.hit;
	const tag = "kind" in h ? h.kind : `${h.vendor}/${h.via}`;
	return `${h.file}:${h.line}:${h.column}:${tag}`;
}

export type { Cookie, VendorHit };
