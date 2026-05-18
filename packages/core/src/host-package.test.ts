import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { readHostPackageMeta } from "./host-package";

const fixture = (name: string) => fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

test("readHostPackageMeta: object author → name, url (homepage), email", () => {
	expect(readHostPackageMeta(fixture("host-pkg-object"))).toEqual({
		name: "acme-app",
		url: "https://acme.example",
		email: "dev@acme.example",
	});
});

test("readHostPackageMeta: string author → email parsed from <…>, no homepage", () => {
	expect(readHostPackageMeta(fixture("host-pkg-string"))).toEqual({
		name: "acme-cli",
		url: undefined,
		email: "cli@acme.example",
	});
});

test("readHostPackageMeta: no package.json → {} (never throws)", () => {
	expect(readHostPackageMeta(fixture("host-pkg-none"))).toEqual({});
});

test("readHostPackageMeta: malformed JSON → {} (never throws)", () => {
	const dir = mkdtempSync(join(tmpdir(), "op-host-pkg-"));
	writeFileSync(join(dir, "package.json"), "{ not valid json", "utf8");
	expect(readHostPackageMeta(dir)).toEqual({});
});
