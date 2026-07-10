import { ContractPrerequisite, defineConfig, LegalBases } from "@policystack/sdk";
import * as scanned from "./policystack.gen";

export default defineConfig(
	{
		company: {
			name: "Astro + PolicyStack Example",
			legalName: "Astro + PolicyStack Example Ltd.",
			address: "1 Example Street, London, United Kingdom",
			url: "https://example.com",
			contact: { email: "privacy@example.com", phone: "+44 20 0000 0000" },
			dpo: { required: false },
		},
		effectiveDate: "2026-07-10",
		jurisdictions: ["eea", "us-ca"],
		data: {
			collected: {
				"Usage Data": ["Pages visited", "Browser type", "IP address"],
			},
			context: {
				"Usage Data": {
					purpose: "To operate, secure, and improve this example application",
					lawfulBasis: LegalBases.LegitimateInterests,
					retention: "90 days",
					provision: ContractPrerequisite("We cannot operate or secure the application."),
				},
			},
		},
		cookies: {
			used: { essential: true },
			context: {
				essential: { lawfulBasis: LegalBases.LegalObligation },
			},
		},
		automatedDecisionMaking: [],
	},
	scanned,
);
