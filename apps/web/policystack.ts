import { defineConfig, LegalBases, Voluntary } from "@policystack/sdk";

// Website disclosures only. No account service runs on this site.
export default defineConfig({
	company: {
		name: "PolicyStack",
		legalName: "PolicyStack Ltd",
		address: "86-90 Paul Street, London, EC2A 4NE, United Kingdom",
		url: "https://policystack.dev",
		contact: { email: "jamie@policystack.dev" },
	},
	effectiveDate: "2026-09-06",
	jurisdictions: ["eea", "uk"],
	data: {
		collected: {
			Correspondence: ["Email address", "Information you choose to include in an enquiry"],
		},
		context: {
			Correspondence: {
				purpose: "Respond to support and design-partner enquiries",
				lawfulBasis: LegalBases.LegitimateInterests,
				retention: "For as long as needed to handle your enquiry and any follow-up",
				provision: Voluntary("Without contact information we cannot reply to your enquiry."),
			},
		},
	},
	thirdParties: [
		{
			name: "OpenPanel",
			purpose:
				"Measure website visits and outgoing link clicks to improve the website and documentation",
			policyUrl: "https://openpanel.dev/privacy",
		},
		{
			name: "Vercel",
			purpose: "Host and deliver this public website",
			policyUrl: "https://vercel.com/legal/privacy-policy",
		},
	],
	automatedDecisionMaking: [],
});
