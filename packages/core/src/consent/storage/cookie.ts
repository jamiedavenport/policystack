import type { ConsentRecord } from "../types";

// SSR base64 fallback when atob/btoa are absent. Typed locally so the consent
// runtime needs no @types/node — @policystack/core stays a pure, node-free build.
declare const Buffer: {
	from(data: string, encoding: string): { toString(encoding: string): string };
};

export type CookieAdapterOptions = {
	name?: string;
	domain?: string;
	path?: string;
	sameSite?: "strict" | "lax" | "none";
	secure?: boolean;
	maxAge?: number;
	request?: Request | { headers: Headers };
	onSetCookie?: (header: string) => void;
};

export type CookieAdapter = {
	name: string;
	read(): ConsentRecord | null;
	write(record: ConsentRecord): void;
	clear(): void;
	serialize(record: ConsentRecord): string;
	deserialize(value: string): ConsentRecord | null;
	/**
	 * The `Set-Cookie` header for the canonical cookie only. Clearing through
	 * this leaves a pre-rebrand `oc_consent` cookie in place, which the lenient
	 * read would then resurrect — SSR callers should prefer
	 * {@link CookieAdapter.getSetCookieHeaders}.
	 */
	getSetCookieHeader(record: ConsentRecord | null): string;
	/**
	 * Every `Set-Cookie` header the caller must emit. Same as
	 * `getSetCookieHeader` for writes; on clear it also expires the legacy
	 * cookie.
	 */
	getSetCookieHeaders(record: ConsentRecord | null): string[];
	parse(header: string | null | undefined): ConsentRecord | null;
};

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365;

const DEFAULT_NAME = "ps_consent";

// ─── oc_ → ps_ rebrand migration shim (#161) — remove pre-freeze ───
// Mirrors localStorageAdapter: canonical writes under `ps_consent`, lenient
// reads so pre-rebrand visitors keep their decision. Only consulted when the
// caller did not pick their own name.
const LEGACY_NAME = "oc_consent";
// ─── end migration shim ───

export function cookieAdapter(options: CookieAdapterOptions = {}): CookieAdapter {
	const name = options.name ?? DEFAULT_NAME;
	const legacyName = options.name === undefined ? LEGACY_NAME : null;
	const path = options.path ?? "/";
	const sameSite = options.sameSite ?? "lax";
	const secure = options.secure ?? true;
	const maxAge = options.maxAge ?? DEFAULT_MAX_AGE;
	const { domain, request, onSetCookie } = options;

	function readCookieHeader(): string | null {
		if (request) {
			const header = request.headers.get("cookie");
			return header ?? null;
		}
		if (typeof document !== "undefined" && typeof document.cookie === "string") {
			return document.cookie;
		}
		return null;
	}

	function readCookieValue(header: string | null | undefined, cookieName: string): string | null {
		if (!header) return null;
		const parts = header.split(";");
		for (const part of parts) {
			const eq = part.indexOf("=");
			if (eq === -1) continue;
			const k = part.slice(0, eq).trim();
			if (k !== cookieName) continue;
			// An expired cookie can linger with an empty value; that carries no
			// record, so treat it as absent rather than letting it shadow the
			// legacy fallback.
			return part.slice(eq + 1).trim() || null;
		}
		return null;
	}

	function parseCookieHeader(header: string | null | undefined): string | null {
		const current = readCookieValue(header, name);
		if (current !== null) return current;
		return legacyName === null ? null : readCookieValue(header, legacyName);
	}

	function decode(value: string | null): ConsentRecord | null {
		if (value === null) return null;
		try {
			const decoded = decodeURIComponent(value);
			const padded = decoded + "=".repeat((4 - (decoded.length % 4)) % 4);
			const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
			const json =
				typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("utf-8");
			return JSON.parse(json) as ConsentRecord;
		} catch {
			return null;
		}
	}

	function encode(record: ConsentRecord): string {
		const json = JSON.stringify(record);
		const b64 =
			typeof btoa === "function" ? btoa(json) : Buffer.from(json, "utf-8").toString("base64");
		return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	}

	function buildHeader(value: string, expireMaxAge: number, cookieName = name): string {
		const parts = [`${cookieName}=${value}`, `Path=${path}`, `Max-Age=${expireMaxAge}`];
		if (domain) parts.push(`Domain=${domain}`);
		parts.push(`SameSite=${capitalize(sameSite)}`);
		if (secure) parts.push("Secure");
		return parts.join("; ");
	}

	function setBrowserCookie(header: string): void {
		if (typeof document !== "undefined") {
			document.cookie = header;
		}
	}

	function getSetCookieHeader(record: ConsentRecord | null): string {
		if (record === null) return buildHeader("", 0);
		return buildHeader(encode(record), maxAge);
	}

	function getSetCookieHeaders(record: ConsentRecord | null): string[] {
		const headers = [getSetCookieHeader(record)];
		// Expire the pre-rebrand cookie too, or the lenient read would resurrect
		// the decision the visitor just withdrew.
		if (record === null && legacyName !== null) {
			headers.push(buildHeader("", 0, legacyName));
		}
		return headers;
	}

	function emit(headers: string[]): void {
		for (const header of headers) {
			setBrowserCookie(header);
			if (onSetCookie) onSetCookie(header);
		}
	}

	return {
		name,
		read() {
			return decode(parseCookieHeader(readCookieHeader()));
		},
		write(record) {
			emit(getSetCookieHeaders(record));
		},
		clear() {
			emit(getSetCookieHeaders(null));
		},
		serialize: encode,
		deserialize: decode,
		getSetCookieHeader,
		getSetCookieHeaders,
		parse(header) {
			return decode(parseCookieHeader(header));
		},
	};
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
