import { expect, test } from "vite-plus/test";
import { EventEmitter } from "node:events";
import { toPackageManager } from "./detect-pm";
import { formatCommand, runInstall } from "./install";

test("formatCommand composes the shell command", () => {
	expect(formatCommand(toPackageManager("bun"), ["a", "b"], true)).toBe("bun add -d a b");
	expect(formatCommand(toPackageManager("npm"), ["a"], false)).toBe("npm install a");
});

test("runInstall resolves immediately when deps is empty", async () => {
	let spawned = false;
	await runInstall(toPackageManager("npm"), [], {
		dev: false,
		cwd: "/tmp",
		spawnImpl: (() => {
			spawned = true;
			return new EventEmitter() as never;
		}) as never,
	});
	expect(spawned).toBe(false);
});

test("runInstall dry-run logs command and does not spawn", async () => {
	const lines: string[] = [];
	let spawned = false;
	await runInstall(toPackageManager("bun"), ["@policystack/sdk"], {
		dev: false,
		cwd: "/tmp",
		dryRun: true,
		log: (l) => lines.push(l),
		spawnImpl: (() => {
			spawned = true;
			return new EventEmitter() as never;
		}) as never,
	});
	expect(spawned).toBe(false);
	expect(lines).toEqual(["> bun add @policystack/sdk"]);
});

test("runInstall resolves on exit code 0", async () => {
	const calls: Array<{ bin: string; args: string[] }> = [];
	const spawnImpl = ((bin: string, args: string[]) => {
		calls.push({ bin, args });
		const ee = new EventEmitter();
		queueMicrotask(() => ee.emit("exit", 0));
		return ee as never;
	}) as never;
	await runInstall(toPackageManager("pnpm"), ["@policystack/sdk"], {
		dev: false,
		cwd: "/tmp",
		log: () => {},
		spawnImpl,
	});
	expect(calls).toEqual([{ bin: "pnpm", args: ["add", "@policystack/sdk"] }]);
});

test("runInstall rejects on non-zero exit", async () => {
	const spawnImpl = (() => {
		const ee = new EventEmitter();
		queueMicrotask(() => ee.emit("exit", 1));
		return ee as never;
	}) as never;
	await expect(
		runInstall(toPackageManager("npm"), ["x"], {
			dev: false,
			cwd: "/tmp",
			log: () => {},
			spawnImpl,
		}),
	).rejects.toThrow(/npm exited with code 1/);
});

test("runInstall builds dev-flag args", async () => {
	const calls: Array<{ bin: string; args: string[] }> = [];
	const spawnImpl = ((bin: string, args: string[]) => {
		calls.push({ bin, args });
		const ee = new EventEmitter();
		queueMicrotask(() => ee.emit("exit", 0));
		return ee as never;
	}) as never;
	await runInstall(toPackageManager("yarn"), ["@policystack/vite"], {
		dev: true,
		cwd: "/tmp",
		log: () => {},
		spawnImpl,
	});
	expect(calls).toEqual([{ bin: "yarn", args: ["add", "-D", "@policystack/vite"] }]);
});
