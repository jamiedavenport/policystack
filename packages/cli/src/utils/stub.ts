import { existsSync, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

export function resolveStubPath(cwd: string, outOverride?: string): string {
	if (outOverride) {
		return isAbsolute(outOverride) ? outOverride : resolve(cwd, outOverride);
	}
	const srcDir = join(cwd, "src");
	if (existsSync(srcDir) && statSync(srcDir).isDirectory()) {
		return join(srcDir, "openpolicy.ts");
	}
	return join(cwd, "openpolicy.ts");
}

export function getStubContents(today = new Date().toISOString().slice(0, 10)) {
	return `import { defineConfig } from "@openpolicy/sdk";

export default defineConfig({
	company: {
		name: "",
		legalName: "",
		address: "",
		contact: { email: "" },
	},
	effectiveDate: "${today}",
	jurisdictions: [],
	data: {
		collected: {},
		context: {},
	},
});
`;
}

type WriteStubResult = { path: string; written: boolean };

export async function writeStub(path: string, force: boolean): Promise<WriteStubResult> {
	if (existsSync(path) && !force) {
		return { path, written: false };
	}
	await writeFile(path, getStubContents());
	return { path, written: true };
}
