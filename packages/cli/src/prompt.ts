/**
 * The setup prompt printed by `init`. The SDK reference is written into the
 * project as a local file (PS-27) — the prompt points the agent at that file,
 * not a remote URL, so it works offline and matches the installed version.
 *
 * The prompt has two deliverables: (1) generate the config, and (2) wire the
 * single provider at the app root. There is ONE provider that supplies both
 * the policy context AND the consent store (PS-23 made the config the single
 * source both derive from), so the agent never wires a separate consent
 * provider — it mounts one component and consent follows from the config.
 *
 * Sentences are kept to single source lines so the printed prompt does not
 * wrap mid-sentence; intentional line breaks use explicit `\n`.
 */

export type Framework = "react" | "vue" | "svelte";

export type BuildAgentPromptOptions = {
	stubRel: string;
	llmsRel: string;
	/** UI framework detected by `detectIntegrations` (the `vite` entry aside). */
	framework?: Framework;
};

function providerSection(stubRel: string, framework?: Framework): string {
	if (framework === "react") {
		const importName = stubRel.replace(/^.*\//, "").replace(/\.tsx?$/, "");
		return [
			`2. Wire the provider. There is ONE provider for everything: import \`PolicyStackProvider\` from \`@policystack/react/provider\` and mount it at the root of your app (the outermost component / root layout) so it wraps the whole tree, passing it the config from ${stubRel}:`,
			"",
			`    import { PolicyStackProvider } from "@policystack/react/provider";`,
			`    import config from "./${importName}";`,
			"",
			`    <PolicyStackProvider config={config}>`,
			`      {/* the rest of your app */}`,
			`    </PolicyStackProvider>`,
			"",
			"Do NOT add a separate consent/cookies provider — `PolicyStackProvider` mounts the consent store automatically when the config declares `cookies`.",
		].join("\n");
	}
	return `2. Wire the provider. There is ONE PolicyStack provider for your framework that supplies both the policy context and the consent store. Mount it once at the root of your app (the outermost component / root layout) so it wraps the whole tree, and pass it the config exported from ${stubRel}. Do NOT add a separate consent/cookies provider — consent is derived from the config's \`cookies\` and mounted by that same provider.`;
}

export function buildAgentPrompt(opts: BuildAgentPromptOptions): string {
	return `Read this codebase carefully, then complete the two steps below using the PolicyStack SDK.

SDK reference: ${opts.llmsRel} — read this file first. It is the complete, type-generated API surface (config shape, valid jurisdiction codes, lawful bases, and the merged policy + consent surface).

1. Generate ${opts.stubRel} using defineConfig(). It should capture:
- Every category of data collected and why
- All third-party services integrated and their purpose
- The applicable jurisdictions, as codes from the SDK reference
- The lawful basis for each data category and each cookie
- Cookie usage (essential, analytics, marketing) and consent categories

${providerSection(opts.stubRel, opts.framework)}

Make only those two changes — write ${opts.stubRel} and the provider wiring. No explanations.
`;
}
