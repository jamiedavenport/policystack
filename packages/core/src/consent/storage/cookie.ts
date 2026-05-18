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
	read(): ConsentRecord | null;
	write(record: ConsentRecord): void;
	clear(): void;
	getSetCookieHeader(record: ConsentRecord | null): string;
	parse(header: string | null | undefined): ConsentRecord | null;
};

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365;

export function cookieAdapter(options: CookieAdapterOptions = {}): CookieAdapter {
	const name = options.name ?? "oc_consent";
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

	function parseCookieHeader(header: string | null | undefined): string | null {
		if (!header) return null;
		const parts = header.split(";");
		for (const part of parts) {
			const eq = part.indexOf("=");
			if (eq === -1) continue;
			const k = part.slice(0, eq).trim();
			if (k !== name) continue;
			return part.slice(eq + 1).trim();
		}
		return null;
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

	function buildHeader(value: string, expireMaxAge: number): string {
		const parts = [`${name}=${value}`, `Path=${path}`, `Max-Age=${expireMaxAge}`];
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

	return {
		read() {
			return decode(parseCookieHeader(readCookieHeader()));
		},
		write(record) {
			const header = getSetCookieHeader(record);
			setBrowserCookie(header);
			if (onSetCookie) onSetCookie(header);
		},
		clear() {
			const header = getSetCookieHeader(null);
			setBrowserCookie(header);
			if (onSetCookie) onSetCookie(header);
		},
		getSetCookieHeader,
		parse(header) {
			return decode(parseCookieHeader(header));
		},
	};
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
