/**
 * The setup prompt printed by `init`. The SDK reference is written into the
 * project as a local file (PS-27) — the prompt points the agent at that file,
 * not a remote URL, so it works offline and matches the installed version.
 */
export function buildAgentPrompt(opts: { stubRel: string; llmsRel: string }): string {
	return `Read this codebase carefully, then generate ${opts.stubRel} using the OpenPolicy SDK.

SDK reference: ${opts.llmsRel} — read this file first. It is the complete, type-generated API surface (config shape, valid jurisdiction codes, lawful bases, and the merged policy + consent surface).

Your output should capture:
- Every category of data collected and why
- All third-party services integrated and their purpose
- The applicable jurisdictions, as codes from the SDK reference
- The lawful basis for each data category and each cookie
- Cookie usage (essential, analytics, marketing) and consent categories

Output only a single ${opts.stubRel} using defineConfig(). No explanations.
`;
}
