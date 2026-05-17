import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { renderSkillPack } from "./skills";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

test("the shipped plugin tree is in sync with renderSkillPack() — run `vp run gen:skills`", () => {
	for (const { path, content } of renderSkillPack()) {
		expect(readFileSync(join(repoRoot, path), "utf8"), `${path} is stale`).toBe(content);
	}
});

test("the pack ships exactly the four skills plus both manifests", () => {
	const paths = renderSkillPack()
		.map((f) => f.path)
		.sort();
	expect(paths).toEqual([
		".claude-plugin/marketplace.json",
		"plugin/.claude-plugin/plugin.json",
		"plugin/skills/policystack-audit/SKILL.md",
		"plugin/skills/policystack-init/SKILL.md",
		"plugin/skills/policystack-instrument/SKILL.md",
		"plugin/skills/policystack-jurisdiction/SKILL.md",
	]);
});

test("skills resolve against the frozen surface (drift canaries)", () => {
	const byPath = new Map(renderSkillPack().map((f) => [f.path, f.content]));
	const audit = byPath.get("plugin/skills/policystack-audit/SKILL.md") ?? "";
	const jurisdiction = byPath.get("plugin/skills/policystack-jurisdiction/SKILL.md") ?? "";
	const instrument = byPath.get("plugin/skills/policystack-instrument/SKILL.md") ?? "";

	// ISSUE_CODES wired into the audit skill — a removed/renamed code fails here.
	expect(audit).toContain("`data-context-missing` — *error*");
	expect(audit).toContain("`data-collected-empty` — *warning*");

	// JURISDICTION_TABLE wired — same wording as renderLlmsTxt()'s canaries,
	// so a frozen-union change without a regen fails here too.
	expect(jurisdiction).toContain("`eea` — opt-in, specific policy text");
	expect(jurisdiction).toContain(
		"`us-ca` — opt-out, specific policy text, inherits `us`, GPC legally binding",
	);

	// SDK presets wired into the instrument skill.
	expect(instrument).toContain("`DataCategories.AccountInfo`");
	expect(instrument).toContain("`Providers.Stripe`");
});

test("every SKILL.md carries the do-not-edit banner and a name/description", () => {
	for (const { path, content } of renderSkillPack()) {
		if (!path.endsWith("SKILL.md")) continue;
		expect(content.startsWith("---\nname: policystack-")).toBe(true);
		expect(content).toContain("\ndescription: ");
		expect(content).toContain("do not edit by hand");
	}
});
