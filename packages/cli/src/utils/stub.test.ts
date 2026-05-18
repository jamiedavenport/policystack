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

test("resolveStubPath picks src/policystack.ts when src/ exists", () => {
	mkdirSync(join(dir, "src"));
	expect(resolveStubPath(dir)).toBe(join(dir, "src", "policystack.ts"));
});

test("resolveStubPath falls back to ./policystack.ts when no src/", () => {
	expect(resolveStubPath(dir)).toBe(join(dir, "policystack.ts"));
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
	expect(out).toContain('import { defineConfig } from "@policystack/sdk"');
	expect(out).toContain("export default defineConfig(");
	expect(out).toContain('effectiveDate: "2026-04-22"');
	expect(out).toContain("jurisdictions: []");
	expect(out).toContain("company:");
	expect(out).toContain("data:");
	expect(out).toContain("collected: {}");
});

test("getStubContents ships a commented cookies skeleton; no consentMechanism", () => {
	const out = getStubContents("2026-04-22");
	expect(out).toContain("Cookies & consent");
	expect(out).toContain("// cookies: {");
	expect(out).toContain("PolicyStackProvider");
	// consentMechanism is derived from the cookie posture — never authored,
	// so it appears nowhere in the stub (not even commented).
	expect(out).not.toContain("consentMechanism");
	// The skeleton stays commented so the stub type-checks exactly as written —
	// no uncommented top-level cookies key.
	expect(out).not.toContain("\n\tcookies:");
});

test("writeStub writes a new file", async () => {
	const target = join(dir, "policystack.ts");
	const res = await writeStub(target, false);
	expect(res.written).toBe(true);
	expect(existsSync(target)).toBe(true);
	expect(readFileSync(target, "utf8")).toContain("defineConfig");
});

test("writeStub skips when file exists and force=false", async () => {
	const target = join(dir, "policystack.ts");
	writeFileSync(target, "existing");
	const res = await writeStub(target, false);
	expect(res.written).toBe(false);
	expect(readFileSync(target, "utf8")).toBe("existing");
});

test("writeStub overwrites when force=true", async () => {
	const target = join(dir, "policystack.ts");
	writeFileSync(target, "existing");
	const res = await writeStub(target, true);
	expect(res.written).toBe(true);
	expect(readFileSync(target, "utf8")).toContain("defineConfig");
});
