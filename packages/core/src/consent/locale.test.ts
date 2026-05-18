import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { LOCALES } from "../locale";
import { normalizeLocale, resolveLocale } from "./locale";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("normalizeLocale", () => {
	it("passes canonical locales through with no warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		for (const locale of LOCALES) expect(normalizeLocale(locale)).toBe(locale);
		expect(warn).not.toHaveBeenCalled();
	});

	it("maps a region/script-tagged locale to its primary subtag, with a warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(normalizeLocale("en-GB")).toBe("en");
		expect(normalizeLocale("fr_FR")).toBe("fr");
		expect(normalizeLocale("DE-AT")).toBe("de");
		expect(warn).toHaveBeenCalledTimes(3);
		expect(warn.mock.calls[0]?.[0]).toContain("PS-36");
	});

	it("falls back to 'en' for an unmappable locale, with a warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(normalizeLocale("pt")).toBe("en");
		expect(normalizeLocale("zz-ZZ")).toBe("en");
		expect(normalizeLocale("")).toBe("en");
		expect(warn).toHaveBeenCalledTimes(3);
		expect(warn.mock.calls[0]?.[0]).toContain("PS-36");
	});
});

describe("resolveLocale", () => {
	it("normalizes an explicit config.locale (with a warning) and prefers it", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(resolveLocale({ categories: [], locale: "fr-FR" })).toBe("fr");
		expect(warn).toHaveBeenCalled();
	});

	it("passes a canonical explicit config.locale through with no warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(resolveLocale({ categories: [], locale: "es" })).toBe("es");
		expect(warn).not.toHaveBeenCalled();
	});

	it("silently coerces navigator.language (no deprecation warning)", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const original = (globalThis as { navigator?: unknown }).navigator;
		Object.defineProperty(globalThis, "navigator", {
			value: { language: "de-CH" },
			configurable: true,
		});
		try {
			expect(resolveLocale({ categories: [] })).toBe("de");
			expect(warn).not.toHaveBeenCalled();
		} finally {
			Object.defineProperty(globalThis, "navigator", {
				value: original,
				configurable: true,
			});
		}
	});

	it("defaults to 'en' when no config.locale and no navigator", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const original = (globalThis as { navigator?: unknown }).navigator;
		Object.defineProperty(globalThis, "navigator", {
			value: undefined,
			configurable: true,
		});
		try {
			expect(resolveLocale({ categories: [] })).toBe("en");
			expect(warn).not.toHaveBeenCalled();
		} finally {
			Object.defineProperty(globalThis, "navigator", {
				value: original,
				configurable: true,
			});
		}
	});
});
