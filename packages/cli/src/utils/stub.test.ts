import { afterEach, beforeEach, expect, test } from "vite-plus/test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getStubContents, resolveStubPath, writeStub } from "./stub";

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "op-stub-"));
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

test("resolveStubPath picks src/openpolicy.ts when src/ exists", () => {
	mkdirSync(join(dir, "src"));
	expect(resolveStubPath(dir)).toBe(join(dir, "src", "openpolicy.ts"));
});

test("resolveStubPath falls back to ./openpolicy.ts when no src/", () => {
	expect(resolveStubPath(dir)).toBe(join(dir, "openpolicy.ts"));
});

test("resolveStubPath honors --out override (relative)", () => {
	mkdirSync(join(dir, "src"));
	expect(resolveStubPath(dir, "configs/policy.ts")).toBe(join(dir, "configs/policy.ts"));
});

test("resolveStubPath honors --out override (absolute)", () => {
	const abs = join(dir, "absolute.ts");
	expect(resolveStubPath(dir, abs)).toBe(abs);
});

test("getStubContents contains required defineConfig fields", () => {
	const out = getStubContents("2026-04-22");
	expect(out).toContain('import { defineConfig } from "@openpolicy/sdk"');
	expect(out).toContain("export default defineConfig(");
	expect(out).toContain('effectiveDate: "2026-04-22"');
	expect(out).toContain("jurisdictions: []");
	expect(out).toContain("company:");
	expect(out).toContain("data:");
	expect(out).toContain("collected: {}");
});

test("writeStub writes a new file", async () => {
	const target = join(dir, "openpolicy.ts");
	const res = await writeStub(target, false);
	expect(res.written).toBe(true);
	expect(existsSync(target)).toBe(true);
	expect(readFileSync(target, "utf8")).toContain("defineConfig");
});

test("writeStub skips when file exists and force=false", async () => {
	const target = join(dir, "openpolicy.ts");
	writeFileSync(target, "existing");
	const res = await writeStub(target, false);
	expect(res.written).toBe(false);
	expect(readFileSync(target, "utf8")).toBe("existing");
});

test("writeStub overwrites when force=true", async () => {
	const target = join(dir, "openpolicy.ts");
	writeFileSync(target, "existing");
	const res = await writeStub(target, true);
	expect(res.written).toBe(true);
	expect(readFileSync(target, "utf8")).toContain("defineConfig");
});
