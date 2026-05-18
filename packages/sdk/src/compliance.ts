import type { JurisdictionId } from "@policystack/core";

export const Compliance = {
	GDPR: {
		jurisdictions: ["eea"] as JurisdictionId[],
	},
	UK_GDPR: {
		jurisdictions: ["uk"] as JurisdictionId[],
	},
	CCPA: {
		jurisdictions: ["us-ca"] as JurisdictionId[],
	},
} as const;
