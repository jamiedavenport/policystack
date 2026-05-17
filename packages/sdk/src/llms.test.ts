import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { renderLlmsTxt } from "./llms";

const here = dirname(fileURLToPath(import.meta.url));
const shipped = join(here, "..", "llms.txt");

test("shipped llms.txt is in sync with renderLlmsTxt() — run `vp run gen:llms`", () => {
	expect(readFileSync(shipped, "utf8")).toBe(renderLlmsTxt());
});

test("llms.txt enumerates the live jurisdiction and lawful-basis tables", () => {
	const out = renderLlmsTxt();
	// Drift canaries: these ride the same runtime tables the compiler uses,
	// so a frozen-union change without a regen fails here too.
	expect(out).toContain("`eea` — opt-in, specific policy text");
	expect(out).toContain(
		"`us-ca` — opt-out, specific policy text, inherits `us`, GPC legally binding",
	);
	expect(out).toContain("`consent` — consent-gated");
	expect(out).toContain("`legitimate_interests` — standing legal ground");
});
