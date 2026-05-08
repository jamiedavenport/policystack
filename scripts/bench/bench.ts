import { execFile as execFileCb } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { type BundleResult, formatBytes, measureBundle } from "./measure/bundle.ts";
import { measureRuntime, type RuntimeResult, startPreviewServer } from "./measure/runtime.ts";
import { EXAMPLE_DIR, type ScenarioName, scenarios } from "./scenarios.ts";

const execFile = promisify(execFileCb);

type Phase = "bundle" | "runtime" | "all";

type ScenarioResult = {
	name: ScenarioName;
	bundle?: BundleResult;
	runtime?: RuntimeResult;
};

function parseArgs(): { only: Phase; iterations: number } {
	let only: Phase = "all";
	let iterations = 5;
	for (const arg of process.argv.slice(2)) {
		if (arg.startsWith("--only=")) only = arg.slice(7) as Phase;
		else if (arg.startsWith("--iterations=")) iterations = Number(arg.slice(13));
	}
	return { only, iterations };
}

async function runBuild(): Promise<void> {
	console.log(`  → building (vite build)…`);
	await execFile("pnpm", ["run", "build"], {
		cwd: EXAMPLE_DIR,
		env: { ...process.env, NODE_ENV: "production" },
		maxBuffer: 64 * 1024 * 1024,
	});
}

async function runScenario(
	name: ScenarioName,
	phase: Phase,
	iterations: number,
	port: number,
): Promise<ScenarioResult> {
	const scenario = scenarios[name];
	console.log(`\n[${name}] applying scenario…`);
	await scenario.apply();

	const result: ScenarioResult = { name };
	try {
		await runBuild();

		if (phase === "bundle" || phase === "all") {
			const bundleDir = join(EXAMPLE_DIR, ".output", "public");
			console.log(`  → measuring bundle at ${bundleDir}…`);
			result.bundle = await measureBundle(bundleDir);
		}

		if (phase === "runtime" || phase === "all") {
			console.log(`  → starting preview server on :${port}…`);
			const server = await startPreviewServer(EXAMPLE_DIR, port);
			try {
				console.log(`  → measuring runtime (${iterations} iterations) at ${server.url}…`);
				result.runtime = await measureRuntime(server.url, iterations);
			} finally {
				await server.stop();
			}
		}
	} finally {
		console.log(`[${name}] restoring…`);
		await scenario.restore();
	}

	return result;
}

function delta(a: number, b: number): string {
	const diff = b - a;
	const sign = diff >= 0 ? "+" : "";
	return `${sign}${formatBytes(Math.abs(diff)).replace(/^/, diff < 0 ? "-" : "")}`;
}

function pctDelta(a: number, b: number): string {
	if (a === 0) return "—";
	const pct = ((b - a) / a) * 100;
	const sign = pct >= 0 ? "+" : "";
	return `${sign}${pct.toFixed(1)}%`;
}

function renderMarkdown(
	baseline: ScenarioResult,
	full: ScenarioResult,
	meta: { date: string; node: string; platform: string; iterations: number },
): string {
	const lines: string[] = [];
	lines.push(`# OpenPolicy Bundle Analysis`);
	lines.push("");
	lines.push(
		`Measured against the \`examples/tanstack\` TanStack Start app. "Baseline" is the same shell with OpenPolicy (privacy policy + cookie banner + compiled policy HTML) removed; "Full" is the example as-shipped.`,
	);
	lines.push("");
	lines.push(
		`_${meta.date} · ${meta.platform} · Node ${meta.node} · ${meta.iterations} runtime iterations (median reported)_`,
	);
	lines.push("");

	if (baseline.bundle && full.bundle) {
		const b = baseline.bundle.totals;
		const f = full.bundle.totals;
		lines.push(`## Bundle size`);
		lines.push("");
		lines.push(`| Metric | Baseline | Full | Δ |`);
		lines.push(`| --- | --- | --- | --- |`);
		lines.push(
			`| Total (raw) | ${formatBytes(b.bytes)} | ${formatBytes(f.bytes)} | ${delta(b.bytes, f.bytes)} (${pctDelta(b.bytes, f.bytes)}) |`,
		);
		lines.push(
			`| Total (gzip) | ${formatBytes(b.gzipBytes)} | ${formatBytes(f.gzipBytes)} | ${delta(b.gzipBytes, f.gzipBytes)} (${pctDelta(b.gzipBytes, f.gzipBytes)}) |`,
		);
		lines.push(
			`| Total (brotli) | ${formatBytes(b.brotliBytes)} | ${formatBytes(f.brotliBytes)} | ${delta(b.brotliBytes, f.brotliBytes)} (${pctDelta(b.brotliBytes, f.brotliBytes)}) |`,
		);
		lines.push(
			`| Asset count | ${b.assetCount} | ${f.assetCount} | ${f.assetCount - b.assetCount >= 0 ? "+" : ""}${f.assetCount - b.assetCount} |`,
		);
		lines.push("");

		lines.push(`### By asset type (gzip)`);
		lines.push("");
		lines.push(`| Type | Baseline | Full | Δ |`);
		lines.push(`| --- | --- | --- | --- |`);
		for (const type of ["js", "css", "html", "font", "image", "other"] as const) {
			const bt = baseline.bundle.byType[type];
			const ft = full.bundle.byType[type];
			if (bt.count === 0 && ft.count === 0) continue;
			lines.push(
				`| ${type} | ${formatBytes(bt.gzipBytes)} (${bt.count}) | ${formatBytes(ft.gzipBytes)} (${ft.count}) | ${delta(bt.gzipBytes, ft.gzipBytes)} |`,
			);
		}
		lines.push("");
	}

	if (baseline.runtime && full.runtime) {
		const b = baseline.runtime.median;
		const f = full.runtime.median;
		lines.push(`## Runtime (median of ${meta.iterations})`);
		lines.push("");
		lines.push(`| Metric | Baseline | Full | Δ |`);
		lines.push(`| --- | --- | --- | --- |`);
		const row = (label: string, bv: number | null, fv: number | null, unit: string) => {
			if (bv === null || fv === null) {
				lines.push(`| ${label} | — | — | — |`);
				return;
			}
			const diff = fv - bv;
			const sign = diff >= 0 ? "+" : "";
			lines.push(
				`| ${label} | ${bv}${unit} | ${fv}${unit} | ${sign}${diff.toFixed(unit === "" ? 3 : 0)}${unit} |`,
			);
		};
		row("TTFB", b.ttfbMs, f.ttfbMs, "ms");
		row("FCP", b.fcpMs, f.fcpMs, "ms");
		row("LCP", b.lcpMs, f.lcpMs, "ms");
		row("CLS", b.cls, f.cls, "");
		row("load event", b.loadMs, f.loadMs, "ms");
		row("JS exec (profiler)", b.jsExecMs, f.jsExecMs, "ms");
		lines.push(
			`| transfer | ${formatBytes(b.transferBytes)} | ${formatBytes(f.transferBytes)} | ${delta(b.transferBytes, f.transferBytes)} |`,
		);
		lines.push(
			`| requests | ${b.requests} | ${f.requests} | ${f.requests - b.requests >= 0 ? "+" : ""}${f.requests - b.requests} |`,
		);
		lines.push("");
	}

	lines.push(`## Method`);
	lines.push("");
	lines.push(
		`Run with \`pnpm run bench\`. Reproduction and metric definitions: see [scripts/bench/README.md](../README.md).`,
	);
	lines.push("");
	return lines.join("\n");
}

async function main() {
	const { only, iterations } = parseArgs();
	const phase: Phase = only;

	console.log(`OpenPolicy bench — phase=${phase}, iterations=${iterations}`);

	const results: Record<ScenarioName, ScenarioResult> = {
		baseline: { name: "baseline" },
		full: { name: "full" },
	};

	// Full first — no mutations, proves the baseline tooling works before touching files
	results.full = await runScenario("full", phase, iterations, 3001);
	results.baseline = await runScenario("baseline", phase, iterations, 3002);

	const outDir = join(import.meta.dirname, "results");
	await mkdir(outDir, { recursive: true });

	const meta = {
		date: new Date().toISOString().slice(0, 10),
		node: process.version,
		platform: `${process.platform}/${process.arch}`,
		iterations,
	};

	const json = {
		meta,
		scenarios: results,
	};
	await writeFile(join(outDir, "latest.json"), `${JSON.stringify(json, null, 2)}\n`);

	const md = renderMarkdown(results.baseline, results.full, meta);
	await writeFile(join(outDir, "latest.md"), md);

	console.log(`\n✓ wrote ${join(outDir, "latest.json")}`);
	console.log(`✓ wrote ${join(outDir, "latest.md")}`);

	// Print summary to stdout
	if (results.baseline.bundle && results.full.bundle) {
		console.log(`\nBundle (gzip):`);
		console.log(`  baseline: ${formatBytes(results.baseline.bundle.totals.gzipBytes)}`);
		console.log(`  full:     ${formatBytes(results.full.bundle.totals.gzipBytes)}`);
		console.log(
			`  delta:    ${delta(results.baseline.bundle.totals.gzipBytes, results.full.bundle.totals.gzipBytes)} (${pctDelta(results.baseline.bundle.totals.gzipBytes, results.full.bundle.totals.gzipBytes)})`,
		);
	}
}

try {
	await main();
} catch (err) {
	// Best-effort restore in case a scenario failed mid-flight
	try {
		await scenarios.baseline.restore();
	} catch {}
	// Also restore the .work dir if any
	await rm(join(import.meta.dirname, ".work"), {
		recursive: true,
		force: true,
	}).catch(() => {});
	console.error(err);
	process.exit(1);
}
