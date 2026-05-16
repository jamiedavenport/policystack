import { expect, test } from "vite-plus/test";
import type { OutputFormat } from "./types";

// PS-15 (§2.3): the `jsx` member was dropped from the public `OutputFormat`
// union — React/Vue/Svelte *are* the JSX story, and the `jsx` throw-path was
// deleted in Phase 0 (PS-2). This test freezes that surface so it cannot
// silently regress.
test("OutputFormat is exactly markdown | html | pdf — no jsx (PS-15 / PS-2)", () => {
	// Exhaustive map over the union: adding or removing a member makes this
	// object literal a type error.
	const all: Record<OutputFormat, true> = { markdown: true, html: true, pdf: true };
	expect(Object.keys(all).sort()).toEqual(["html", "markdown", "pdf"]);

	// Re-introducing `jsx` to the union would turn this into an unused
	// `@ts-expect-error`, failing the type-check.
	// @ts-expect-error — "jsx" is not a member of OutputFormat
	const notAFormat: OutputFormat = "jsx";
	void notAFormat;
});
