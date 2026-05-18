import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { type Issue, type PolicyStackConfig, validate } from "@policystack/core";
import { bundleRequire } from "bundle-require";
import { defineCommand } from "citty";
import consola from "consola";
import { resolveStubPath } from "../utils/stub";

/**
 * The machine-readable result of `policystack validate`. `issues` is the frozen
 * `Issue` shape from `@policystack/core` (Phase 2) verbatim — agents parse the
 * stable `code`/`level` and branch on `ok` (which always tracks the exit code:
 * `ok === false` ⇔ exit 1). `loadError` is set instead of `issues` when the
 * config couldn't be loaded at all (missing file, TS syntax error, no default
 * export); a load failure is always `ok: false`.
 */
export type ValidateResult = {
	ok: boolean;
	config: string;
	issues: Issue[];
	errorCount: number;
	warningCount: number;
	loadError: string | null;
};

/**
 * Loads the user's config via bundle-require and returns the merged config
 * surface — the flat {@link PolicyStackConfig} that `defineConfig()` produces
 * (the §4.1 shared-config bridge, PS-23). This deliberately mirrors
 * `@policystack/vite`'s `loadAndValidateConfig` rather than importing it: the
 * CLI must not depend on the bundler plugin (and its oxc-parser graph), and it
 * has no `strict`/`suppress` issue policy — that is intentionally a Vite-only
 * concern (PS-13). Load/parse errors are returned, not thrown, so the command
 * can report them as a non-zero exit instead of crashing.
 */
async function loadConfig(
	file: string,
): Promise<{ config: PolicyStackConfig | null; loadError: Error | null }> {
	try {
		const { mod } = await bundleRequire({
			filepath: file,
			notExternal: [/^@policystack\//],
			esbuildOptions: {
				platform: "node",
				// esbuild logs to stderr by default; silence it so `--json`
				// stdout stays a single clean object and we surface failures
				// through `loadError` ourselves.
				logLevel: "silent",
			},
		});
		const config = (mod as { default?: PolicyStackConfig }).default;
		if (!config) {
			return { config: null, loadError: new Error(`${file} has no default export`) };
		}
		return { config, loadError: null };
	} catch (err) {
		return { config: null, loadError: err instanceof Error ? err : new Error(String(err)) };
	}
}

function reportHuman(result: ValidateResult): void {
	if (result.loadError) {
		consola.error(result.loadError);
		return;
	}
	for (const issue of result.issues) {
		const line = `${issue.code}: ${issue.message}`;
		if (issue.level === "error") consola.error(line);
		else consola.warn(line);
	}
	const warnings = `${result.warningCount} warning${result.warningCount === 1 ? "" : "s"}`;
	if (result.ok) {
		consola.success(
			result.warningCount > 0 ? `Config is valid (${warnings}).` : "Config is valid.",
		);
	} else {
		const errors = `${result.errorCount} error${result.errorCount === 1 ? "" : "s"}`;
		consola.error(`Validation failed: ${errors}, ${warnings}.`);
	}
}

/**
 * The pure core of `policystack validate`: resolve the config path, load it, run
 * the frozen {@link validate}, and return the {@link ValidateResult}. No I/O
 * side effects (no stdout, no `process.exitCode`) — `runValidate` adds those,
 * and the `policystack mcp` `validate_config` tool (PS-29) reuses *this*
 * directly because its stdout is the MCP stdio transport and must stay clean.
 */
export async function resolveValidateResult(args: {
	cwd: string;
	config?: string;
}): Promise<ValidateResult> {
	const cwd = resolve(args.cwd);
	const file = resolveStubPath(cwd, args.config);

	if (!existsSync(file)) {
		return {
			ok: false,
			config: file,
			issues: [],
			errorCount: 0,
			warningCount: 0,
			loadError: `No config found at ${file} — pass a path or run \`policystack init\` first.`,
		};
	}
	const { config, loadError } = await loadConfig(file);
	if (loadError || !config) {
		return {
			ok: false,
			config: file,
			issues: [],
			errorCount: 0,
			warningCount: 0,
			loadError: (loadError ?? new Error(`${file} did not load`)).message,
		};
	}
	const issues = validate(config);
	const errorCount = issues.filter((i) => i.level === "error").length;
	return {
		ok: errorCount === 0,
		config: file,
		issues,
		errorCount,
		warningCount: issues.length - errorCount,
		loadError: null,
	};
}

export async function runValidate(args: {
	cwd: string;
	config?: string;
	json: boolean;
}): Promise<ValidateResult> {
	const result = await resolveValidateResult({ cwd: args.cwd, config: args.config });

	if (args.json) {
		// `--json` contract: exactly one JSON object on stdout, nothing else.
		process.stdout.write(`${JSON.stringify(result)}\n`);
	} else {
		reportHuman(result);
	}
	if (!result.ok) process.exitCode = 1;
	return result;
}

export const validateCommand = defineCommand({
	meta: {
		name: "validate",
		description:
			"Validate a policystack config and report issues. Exits non-zero when there are errors; --json emits structured issues for unattended agent loops.",
	},
	args: {
		config: {
			type: "positional",
			required: false,
			description:
				"Path to the policystack config (defaults to src/policystack.ts, or policystack.ts if there is no src/ directory)",
		},
		cwd: {
			type: "string",
			description: "Working directory",
			default: ".",
		},
		json: {
			type: "boolean",
			description:
				"Emit a single JSON object { ok, config, issues, errorCount, warningCount, loadError } to stdout",
			default: false,
		},
	},
	async run({ args }) {
		await runValidate({
			cwd: args.cwd,
			config: args.config,
			json: args.json,
		});
	},
});
