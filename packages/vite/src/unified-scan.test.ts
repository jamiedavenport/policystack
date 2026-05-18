import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { isCanonicalSdkSpecifier } from "./sdk-specifier";
import { createUnifiedScanner } from "./unified-scan";

let tmp: string;
beforeEach(async () => {
	tmp = await mkdtemp(join(tmpdir(), "openpolicy-unified-"));
	await mkdir(join(tmp, "src"), { recursive: true });
});
afterEach(async () => {
	await rm(tmp, { recursive: true, force: true });
});

function scanner(consentEnabled: boolean) {
	return createUnifiedScanner({
		root: tmp,
		srcDir: join(tmp, "src"),
		extensions: [".ts", ".tsx"],
		ignore: [],
		genFile: null,
		consentEnabled,
		usePackageJson: false,
		useCookiesPackageJson: false,
		sdkMatcher: isCanonicalSdkSpecifier,
		prewarm: async () => {},
	});
}

describe("unified scanner — one walk, two outputs", () => {
	it("produces policy AND consent findings from a single scan", async () => {
		await writeFile(
			join(tmp, "src", "track.ts"),
			[
				`import { collecting } from "@policystack/sdk";`,
				`import posthog from "posthog-js";`,
				`export const x = collecting("Account", { a: 1 }, { a: "A" });`,
				`posthog.capture("evt");`,
			].join("\n"),
		);

		const { scanned, consent } = await scanner(true).fullScan();

		// Policy half (feeds policystack.gen.ts)
		expect(scanned.dataCollected).toEqual({ Account: ["A"] });
		// Consent half (ungated tracking import) — same walk
		expect(consent.vendors.map((v) => v.vendor)).toContain("posthog");
		expect(consent.vendors[0]?.detector).toBe("import");
		expect(consent.ungated.length).toBeGreaterThan(0);
	});

	it("is inert for consent when consent is disabled, policy still runs", async () => {
		await writeFile(
			join(tmp, "src", "track.ts"),
			[
				`import { collecting } from "@policystack/sdk";`,
				`import posthog from "posthog-js";`,
				`export const x = collecting("Account", { a: 1 }, { a: "A" });`,
				`posthog.capture("evt");`,
			].join("\n"),
		);

		const { scanned, consent } = await scanner(false).fullScan();

		expect(scanned.dataCollected).toEqual({ Account: ["A"] });
		expect(consent.vendors).toEqual([]);
		expect(consent.ungated).toEqual([]);
	});

	it("scopes policy extraction to srcDir but scans consent project-wide", async () => {
		// SDK call outside srcDir must NOT feed the gen module…
		await writeFile(
			join(tmp, "outside.ts"),
			`import { collecting } from "@policystack/sdk";\nexport const y = collecting("Leaked", { a: 1 }, { a: "A" });\n`,
		);
		// …but a tracking import outside srcDir is still a consent finding.
		await writeFile(join(tmp, "outside-track.ts"), `import "posthog-js";\n`);
		await writeFile(
			join(tmp, "src", "ok.ts"),
			`import { collecting } from "@policystack/sdk";\nexport const x = collecting("Account", { a: 1 }, { a: "A" });\n`,
		);

		const { scanned, consent } = await scanner(true).fullScan();

		expect(Object.keys(scanned.dataCollected)).toEqual(["Account"]);
		expect(consent.vendors.some((v) => v.file.endsWith("outside-track.ts"))).toBe(true);
	});

	it("dev rescanFileConsent returns the ungated delta for one file", async () => {
		const f = join(tmp, "src", "track.ts");
		await writeFile(f, `import "posthog-js";\n`);
		const s = scanner(true);
		await s.fullScan();
		const delta = await s.rescanFileConsent(f);
		expect(delta).not.toBeNull();
		expect(delta?.next.length).toBeGreaterThan(0);
	});
});
