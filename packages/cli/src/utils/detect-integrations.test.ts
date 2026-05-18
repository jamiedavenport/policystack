import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectIntegrations } from "./detect-integrations";

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "op-int-"));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

function writePkg(body: Record<string, unknown>) {
	writeFileSync(join(dir, "package.json"), JSON.stringify(body));
}

test("returns empty when no package.json", () => {
	expect(detectIntegrations(dir)).toEqual([]);
});

test("detects vite as a devDep integration", () => {
	writePkg({ devDependencies: { vite: "^5.0.0" } });
	const got = detectIntegrations(dir);
	expect(got).toEqual([{ trigger: "vite", pkg: "@policystack/vite", dev: true }]);
});

test("detects react as a prod dep integration", () => {
	writePkg({ dependencies: { react: "^19.0.0" } });
	const got = detectIntegrations(dir);
	expect(got).toEqual([{ trigger: "react", pkg: "@policystack/react", dev: false }]);
});

test("detects vue as a prod dep integration", () => {
	writePkg({ dependencies: { vue: "^3.5.0" } });
	const got = detectIntegrations(dir);
	expect(got).toEqual([{ trigger: "vue", pkg: "@policystack/vue", dev: false }]);
});

test("detects svelte as a prod dep integration", () => {
	writePkg({ dependencies: { svelte: "^5.0.0" } });
	const got = detectIntegrations(dir);
	expect(got).toEqual([{ trigger: "svelte", pkg: "@policystack/svelte", dev: false }]);
});

test("detects multiple integrations (vite + react)", () => {
	writePkg({
		dependencies: { react: "^19.0.0" },
		devDependencies: { vite: "^5.0.0" },
	});
	const got = detectIntegrations(dir);
	expect(got.map((i) => i.pkg).sort()).toEqual(["@policystack/react", "@policystack/vite"]);
});

test("returns empty when no triggers match", () => {
	writePkg({ dependencies: { lodash: "^4.0.0" } });
	expect(detectIntegrations(dir)).toEqual([]);
});
