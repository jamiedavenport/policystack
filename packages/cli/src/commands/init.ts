import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import { buildAgentPrompt } from "../prompt";
import { detectIntegrations, type Integration } from "../utils/detect-integrations";
import { resolveLlmsPath, writeLlms } from "../utils/llms";
import {
	detectPackageManager,
	type PackageManager,
	type PackageManagerName,
	toPackageManager,
} from "../utils/detect-pm";
import { formatCommand, runInstall } from "../utils/install";
import { resolveStubPath, writeStub } from "../utils/stub";

const SDK_PACKAGE = "@policystack/sdk";

type InitArgs = {
	cwd: string;
	pm?: string;
	skipInstall: boolean;
	dryRun: boolean;
	yes: boolean;
	out?: string;
	force: boolean;
};

function printPrompt(prompt: string) {
	const top = "─── Copy the prompt below into your coding agent ───";
	const bottom = "─── End of prompt ───";
	process.stdout.write(`\n${top}\n\n${prompt}\n${bottom}\n\n`);
}

function summarize(
	pm: PackageManager,
	plan: Array<{ deps: string[]; dev: boolean }>,
	stubPath: string,
	stubExists: boolean,
	cwd: string,
) {
	consola.info(`Package manager: ${pm.name}`);
	if (plan.length === 0) {
		consola.info("Nothing to install.");
	} else {
		consola.info("Will install:");
		for (const step of plan) {
			consola.log(`  ${formatCommand(pm, step.deps, step.dev)}`);
		}
	}
	const rel = relative(cwd, stubPath) || stubPath;
	if (stubExists) {
		consola.info(`Stub already present at ${rel} (use --force to overwrite).`);
	} else {
		consola.info(`Will create stub at ${rel}.`);
	}
}

export async function runInit(args: InitArgs): Promise<void> {
	const cwd = resolve(args.cwd);

	if (!existsSync(join(cwd, "package.json"))) {
		consola.error(`No package.json found in ${cwd}. Run \`npm init -y\` (or equivalent) first.`);
		process.exitCode = 1;
		return;
	}

	consola.box(
		"Welcome to PolicyStack\nInstalling packages and preparing a setup prompt for your coding agent.",
	);

	const pm = args.pm ? toPackageManager(args.pm as PackageManagerName) : detectPackageManager(cwd);

	const integrations = detectIntegrations(cwd);
	const prodDeps = [SDK_PACKAGE, ...integrations.filter((i) => !i.dev).map((i) => i.pkg)];
	const devDeps = integrations.filter((i) => i.dev).map((i) => i.pkg);

	// The single UI framework drives the provider-wiring snippet in the prompt
	// (the `vite` integration is a bundler entry, not a UI framework).
	const framework = (["react", "vue", "svelte"] as const).find((f) =>
		integrations.some((i) => i.trigger === f),
	);

	const plan = [
		{ deps: prodDeps, dev: false },
		...(devDeps.length > 0 ? [{ deps: devDeps, dev: true }] : []),
	].filter((s) => s.deps.length > 0);

	const stubPath = resolveStubPath(cwd, args.out);
	const stubExists = existsSync(stubPath);

	if (integrations.length > 0) {
		consola.info(`Detected: ${integrations.map((i: Integration) => i.trigger).join(", ")}`);
	}
	summarize(pm, plan, stubPath, stubExists, cwd);

	if (!args.yes && !args.dryRun) {
		const proceed = await consola.prompt("Proceed?", {
			type: "confirm",
			initial: true,
			cancel: "reject",
		});
		if (!proceed) {
			consola.warn("Aborted.");
			return;
		}
	}

	if (!args.skipInstall) {
		for (const step of plan) {
			await runInstall(pm, step.deps, {
				dev: step.dev,
				cwd,
				dryRun: args.dryRun,
			});
		}
	}

	const llmsPath = resolveLlmsPath(stubPath);
	const stubRel = relative(cwd, stubPath) || stubPath;
	const llmsRel = relative(cwd, llmsPath) || llmsPath;

	if (args.dryRun) {
		consola.info("Dry run — no files written.");
	} else {
		const stub = await writeStub(stubPath, args.force);
		if (stub.written) {
			consola.success(`Created ${stubRel}`);
		} else {
			consola.info(`Kept existing ${stubRel}`);
		}
		const llms = await writeLlms(llmsPath);
		consola.success(`${llms.written ? "Created" : "Updated"} ${llmsRel}`);
	}

	printPrompt(buildAgentPrompt({ stubRel, llmsRel, framework }));

	consola.success(
		"Paste the prompt above into your coding agent (Claude Code, Cursor, etc.) to finish setup.",
	);

	consola.warn(
		"PolicyStack generates policy documents from your config — it does not provide legal advice. Have a lawyer review your policies before publication. https://policystack.dev/legal-notice",
	);
}

export const initCommand = defineCommand({
	meta: {
		name: "init",
		description:
			"Install PolicyStack into the current project and print a setup prompt for coding agents",
	},
	args: {
		cwd: {
			type: "string",
			description: "Working directory",
			default: ".",
		},
		pm: {
			type: "string",
			description: "Override package-manager detection (bun|pnpm|yarn|npm)",
		},
		"skip-install": {
			type: "boolean",
			description: "Skip package installation; print the prompt only",
			default: false,
		},
		"dry-run": {
			type: "boolean",
			description: "Show planned actions without executing them",
			default: false,
		},
		yes: {
			type: "boolean",
			alias: "y",
			description: "Skip the confirmation prompt",
			default: false,
		},
		out: {
			type: "string",
			description:
				"Output path for the policystack.ts stub (defaults to src/policystack.ts if src/ exists)",
		},
		force: {
			type: "boolean",
			description: "Overwrite an existing stub file",
			default: false,
		},
	},
	async run({ args }) {
		await runInit({
			cwd: args.cwd,
			pm: args.pm,
			skipInstall: args["skip-install"],
			dryRun: args["dry-run"],
			yes: args.yes,
			out: args.out,
			force: args.force,
		});
	},
});
