import { describe, expect, it } from "vite-plus/test";
import { CONSENT_REGISTRY } from "../registry";
import { documentCookieRule } from "./rules/document-cookie";
import { vendorImportsRule } from "./rules/vendor-imports";
import { parseFile } from "./parser";
import { walk } from "./visit";

const registry = CONSENT_REGISTRY;

function ungated(source: string, file = "x.tsx"): ReturnType<typeof walk>["ungated"] {
	const parsed = parseFile(file, source)!;
	return walk(parsed, [documentCookieRule, vendorImportsRule], registry).ungated;
}

describe("ungated heuristic", () => {
	it("flags top-level cookie writes as ungated", () => {
		const u = ungated("document.cookie = 'a=1';", "x.ts");
		expect(u).toHaveLength(1);
		expect(u[0]!.reason).toBe("cookie-outside-gate");
	});

	it("does not flag hits inside a <ConsentGate>", () => {
		const src = `
function App() {
  return (
    <ConsentGate purpose="analytics">
      {(() => { document.cookie = 'a=1'; return null; })()}
    </ConsentGate>
  );
}
`;
		expect(ungated(src)).toHaveLength(0);
	});

	it("does not flag hits inside an if (consent.has(...)) gate", () => {
		const src = `
if (consent.has('analytics')) {
  document.cookie = 'a=1';
}
`;
		expect(ungated(src, "x.ts")).toHaveLength(0);
	});

	it("does not flag hits inside an acceptAll helper", () => {
		const src = `
function acceptAll() {
  document.cookie = 'a=1';
}
`;
		expect(ungated(src, "x.ts")).toHaveLength(0);
	});

	it("does not flag hits inside a setSomething helper", () => {
		const src = `
function setAnalyticsCookie() {
  document.cookie = 'a=1';
}
`;
		expect(ungated(src, "x.ts")).toHaveLength(0);
	});

	it("flags vendor imports as ungated regardless of file location", () => {
		const u = ungated("import 'posthog-js';", "x.ts");
		expect(u).toHaveLength(1);
		expect(u[0]!.reason).toBe("vendor-outside-gate");
	});
});
