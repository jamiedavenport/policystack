import {
	type ConsentModel,
	isConsentGated,
	type JurisdictionId,
	JURISDICTION_TABLE,
	type LegalBasis,
} from "@policystack/core";

/**
 * One source of truth for the human description of a frozen jurisdiction /
 * lawful basis. Both `renderLlmsTxt()` and the `policystack mcp` tools
 * (`explain_jurisdiction`, the lawful-basis reference) call these, so the
 * agent-facing prose provably cannot drift between `llms.txt` and the MCP
 * server (PS-29). `summary` is the exact line `llms.txt` already shipped — keep
 * it byte-stable (the `llms.test.ts` drift guard pins it).
 */
export type JurisdictionDescription = {
	id: JurisdictionId;
	consentModel: ConsentModel;
	policyText: "specific" | "equivalent";
	parent: JurisdictionId | null;
	gpcLegallyBinding: boolean;
	/** One-line summary, without the leading `- ` list marker. */
	summary: string;
};

export function describeJurisdiction(id: JurisdictionId): JurisdictionDescription {
	const cap = JURISDICTION_TABLE[id];
	const parent = cap.parent ?? null;
	const parentText = parent ? `, inherits \`${parent}\`` : "";
	const gpc = cap.gpcLegallyBinding ? ", GPC legally binding" : "";
	return {
		id,
		consentModel: cap.consentModel,
		policyText: cap.policyText,
		parent,
		gpcLegallyBinding: cap.gpcLegallyBinding,
		summary: `\`${id}\` — ${cap.consentModel}, ${cap.policyText} policy text${parentText}${gpc}`,
	};
}

/** Every jurisdiction id, ascending — the shared sort order for both artifacts. */
export function jurisdictionIds(): JurisdictionId[] {
	return (Object.keys(JURISDICTION_TABLE) as JurisdictionId[]).sort((a, b) => a.localeCompare(b));
}

/**
 * `- <summary>` lines for every jurisdiction. The single rendering of the
 * jurisdiction table — `renderLlmsTxt()` and the skill pack both consume this
 * so the prose provably cannot fork (PS-27/PS-29).
 */
export function jurisdictionSummaryLines(): string[] {
	return jurisdictionIds().map((id) => `- ${describeJurisdiction(id).summary}`);
}

export type LawfulBasisDescription = {
	basis: LegalBasis;
	consentGated: boolean;
	/** One-line summary, without the leading `- ` list marker. */
	summary: string;
};

export function describeLawfulBasis(basis: LegalBasis): LawfulBasisDescription {
	const gated = isConsentGated(basis);
	return {
		basis,
		consentGated: gated,
		summary: `\`${basis}\` — ${
			gated
				? "consent-gated (toggleable in the banner)"
				: "standing legal ground (category renders locked-on)"
		}`,
	};
}
