import { expect, test } from "vite-plus/test";
import { buildAgentPrompt } from "./prompt";

const base = { stubRel: "src/policystack.ts", llmsRel: "src/policystack.llms.txt" };

test("prompt always points at the SDK reference and the stub", () => {
	const out = buildAgentPrompt(base);
	expect(out).toContain("src/policystack.llms.txt");
	expect(out).toContain("src/policystack.ts");
});

test("prompt has both a config step and a provider-wiring step", () => {
	const out = buildAgentPrompt(base);
	expect(out).toContain("1. Generate src/policystack.ts");
	expect(out).toContain("2. Wire the provider");
	// One provider for both concerns — never a separate consent provider.
	expect(out).toContain("Do NOT add a separate consent");
});

test("no framework → framework-generic wording, no react hard-coding", () => {
	const out = buildAgentPrompt(base);
	expect(out).toContain("ONE PolicyStack provider for your");
	expect(out).not.toContain("PolicyStackProvider");
	expect(out).not.toContain("@policystack/react/provider");
});

test("react → PolicyStack snippet from @policystack/react/provider", () => {
	const out = buildAgentPrompt({ ...base, framework: "react" });
	expect(out).toContain('import { PolicyStack } from "@policystack/react/provider";');
	expect(out).toContain('from "@policystack/react/provider"');
	expect(out).toContain("<PolicyStack config={config}>");
	// import path is derived from the stub's basename
	expect(out).toContain('import config from "./policystack"');
});

test("non-react framework stays generic (no react import path)", () => {
	const out = buildAgentPrompt({ ...base, framework: "vue" });
	expect(out).toContain("ONE PolicyStack provider for your");
	expect(out).not.toContain("@policystack/react/provider");
});
