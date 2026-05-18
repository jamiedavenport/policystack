import { afterAll, afterEach, beforeEach, expect, test } from "vite-plus/test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArgsDef, CommandMeta } from "citty";
import { initCommand, runInit } from "./init";

let dir: string;
let prevExitCode: typeof process.exitCode;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "op-init-"));
	prevExitCode = process.exitCode;
	process.exitCode = undefined;
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
	process.exitCode = prevExitCode;
});

afterAll(() => {
	process.exitCode = 0;
});

test("initCommand has correct name", () => {
	expect((initCommand.meta as CommandMeta)?.name).toBe("init");
});

test("initCommand exposes expected args", () => {
	const args = initCommand.args as ArgsDef;
	expect(args?.cwd?.type).toBe("string");
	expect(args?.pm?.type).toBe("string");
	expect(args?.["skip-install"]?.type).toBe("boolean");
	expect(args?.["dry-run"]?.type).toBe("boolean");
	expect(args?.yes?.type).toBe("boolean");
	expect(args?.out?.type).toBe("string");
	expect(args?.force?.type).toBe("boolean");
});

test("runInit sets exit code 1 when no package.json", async () => {
	await runInit({
		cwd: dir,
		skipInstall: true,
		dryRun: true,
		yes: true,
		force: false,
	});
	expect(process.exitCode).toBe(1);
});

test("runInit dry-run with skip-install writes no files", async () => {
	writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "scratch" }));
	await runInit({
		cwd: dir,
		skipInstall: true,
		dryRun: true,
		yes: true,
		force: false,
	});
	expect(existsSync(join(dir, "policystack.ts"))).toBe(false);
});

test("runInit writes stub to policystack.ts at repo root when no src/", async () => {
	writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "scratch" }));
	await runInit({
		cwd: dir,
		skipInstall: true,
		dryRun: false,
		yes: true,
		force: false,
	});
	expect(existsSync(join(dir, "policystack.ts"))).toBe(true);
});

test("runInit prints a react provider-wiring prompt when react is a dep", async () => {
	writeFileSync(
		join(dir, "package.json"),
		JSON.stringify({ name: "scratch", dependencies: { react: "19.0.0" } }),
	);
	const orig = process.stdout.write;
	const chunks: string[] = [];
	process.stdout.write = ((chunk: string | Uint8Array) => {
		chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
		return true;
	}) as typeof process.stdout.write;
	try {
		await runInit({ cwd: dir, skipInstall: true, dryRun: true, yes: true, force: false });
	} finally {
		process.stdout.write = orig;
	}
	const out = chunks.join("");
	expect(out).toContain("2. Wire the provider");
	expect(out).toContain("PolicyStackProvider");
	expect(out).toContain("@policystack/react/provider");
});
