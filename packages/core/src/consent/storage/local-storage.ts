import type { ConsentRecord } from "../types";

const DEFAULT_KEY = "ps_consent";

// ─── oc_ → ps_ rebrand migration shim (#161) — remove pre-freeze ───
// Writes are canonical (`ps_consent`); reads stay lenient so visitors who
// decided under the pre-rebrand key are not re-prompted. Only consulted when
// the caller did not pick their own key — a custom-keyed adapter must never
// read the legacy key. `clear()` is the deliberate exception to "never delete":
// it removes both, or a withdrawn decision would be resurrected by the
// fallback read on the very next `read()`.
const LEGACY_KEY = "oc_consent";
// ─── end migration shim ───

export type LocalStorageAdapterOptions = {
	key?: string;
};

export type LocalStorageAdapter = {
	read(): ConsentRecord | null;
	write(record: ConsentRecord): void;
	clear(): void;
	subscribe(listener: (record: ConsentRecord | null) => void): () => void;
};

export function localStorageAdapter(options: LocalStorageAdapterOptions = {}): LocalStorageAdapter {
	const key = options.key ?? DEFAULT_KEY;
	const legacyKey = options.key === undefined ? LEGACY_KEY : null;
	const memory = new Map<string, string>();

	function getStorage(): Storage | null {
		try {
			if (typeof globalThis === "undefined") return null;
			const ls = (globalThis as { localStorage?: Storage }).localStorage;
			if (!ls) return null;
			const probe = "__ps_probe__";
			ls.setItem(probe, "1");
			ls.removeItem(probe);
			return ls;
		} catch {
			return null;
		}
	}

	function readKey(name: string): string | null {
		const ls = getStorage();
		if (ls) {
			try {
				// An empty entry carries no record; treat it as absent rather than
				// letting it shadow the legacy fallback below.
				return ls.getItem(name) || null;
			} catch {
				// fall through to memory
			}
		}
		return memory.get(name) || null;
	}

	function readRaw(): string | null {
		const current = readKey(key);
		if (current !== null) return current;
		return legacyKey === null ? null : readKey(legacyKey);
	}

	function writeRaw(value: string): void {
		const ls = getStorage();
		if (ls) {
			try {
				ls.setItem(key, value);
				return;
			} catch {
				// fall through to memory
			}
		}
		memory.set(key, value);
	}

	function clearRaw(): void {
		const ls = getStorage();
		// The legacy key goes too, otherwise readRaw() would fall back to it and
		// resurrect the decision the visitor just withdrew.
		for (const name of legacyKey === null ? [key] : [key, legacyKey]) {
			if (ls) {
				try {
					ls.removeItem(name);
				} catch {
					// ignore
				}
			}
			memory.delete(name);
		}
	}

	function decode(raw: string | null): ConsentRecord | null {
		if (raw === null) return null;
		try {
			return JSON.parse(raw) as ConsentRecord;
		} catch {
			return null;
		}
	}

	return {
		read() {
			return decode(readRaw());
		},
		write(record) {
			writeRaw(JSON.stringify(record));
		},
		clear() {
			clearRaw();
		},
		subscribe(listener) {
			const target =
				typeof globalThis !== "undefined" ? (globalThis as { window?: Window }).window : undefined;
			if (!target || typeof target.addEventListener !== "function") {
				return () => {};
			}
			const handler = (event: Event) => {
				const e = event as StorageEvent;
				if (e.key !== key && e.key !== legacyKey && e.key !== null) return;
				// A legacy-key event is only news if the canonical key is still empty;
				// otherwise the canonical value already won and readRaw() reflects it.
				if (e.key !== null && e.key === legacyKey && readKey(key) !== null) return;
				listener(decode(e.newValue ?? readRaw()));
			};
			target.addEventListener("storage", handler);
			return () => {
				target.removeEventListener("storage", handler);
			};
		},
	};
}
