import { ContractPrerequisite, defineConfig, LegalBases } from "@openpolicy/sdk";
import { cookies, dataCollected, thirdParties } from "./openpolicy.gen";

export default defineConfig({
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-03-03",
	jurisdictions: ["eu", "us-ca"],
	data: {
		collected: {
			...dataCollected,
			"Usage Data": ["Pages visited", "Browser type", "IP address"],
		},
		context: {
			"Account Information": {
				purpose: "To authenticate users and send service notifications",
				lawfulBasis: LegalBases.Contract,
				retention: "Until account deletion",
				provision: ContractPrerequisite("We cannot create or operate your account."),
			},
			"Usage Data": {
				purpose: "To understand product usage and improve the service",
				lawfulBasis: LegalBases.LegitimateInterests,
				retention: "90 days",
				provision: ContractPrerequisite("We cannot deliver or secure the service."),
			},
		},
	},
	cookies: {
		used: cookies,
		context: {
			essential: { lawfulBasis: LegalBases.LegalObligation },
			analytics: { lawfulBasis: LegalBases.Consent },
			marketing: { lawfulBasis: LegalBases.Consent },
		},
	},
	thirdParties,
	trackingTechnologies: ["web beacons", "local storage"],
	consentMechanism: {
		hasBanner: true,
		hasPreferencePanel: true,
		canWithdraw: true,
	},
	children: { underAge: 16, noticeUrl: "https://acme.com/parental-notice" },
	automatedDecisionMaking: [],
});
