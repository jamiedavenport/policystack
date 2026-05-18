import { expect, test } from "vite-plus/test";
import type { CommandMeta, SubCommandsDef } from "citty";
import { mainCommand, run } from "./index";

test("run is a function", () => {
	expect(typeof run).toBe("function");
});

test("mainCommand has correct name", () => {
	expect((mainCommand.meta as CommandMeta)?.name).toBe("policystack");
});

test("mainCommand has init subcommand", () => {
	expect(typeof (mainCommand.subCommands as SubCommandsDef)?.init).toBe("function");
});

test("mainCommand exposes validate (the agent-loop surface) but not generate", () => {
	const subs = mainCommand.subCommands as SubCommandsDef;
	expect(typeof subs?.validate).toBe("function");
	expect(subs?.generate).toBeUndefined();
});
