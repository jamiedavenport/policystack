import { ContractPrerequisite, defineConfig, LegalBases } from "@openpolicy/sdk";
import { timezoneResolver } from "@openpolicy/core/consent";
import { localStorageAdapter } from "@openpolicy/core/consent/storage/local-storage";

export default defineConfig({
	company: {
		name: "PolicyStack",
		legalName: "PolicyStack Ltd",
		address: "86-90 Paul Street, London, EC2A 4NE, United Kingdom",
		contact: { email: "jamie@openpolicy.sh" },
	},
	effectiveDate: "2026-05-12",
	jurisdictions: ["eea", "uk", "us-ca"],
	data: {
		collected: {
			"Account Information": ["Name", "Email address"],
			"Session Data": ["IP address", "User agent"],
			"Usage Data": ["Pages visited", "Referrer"],
		},
		context: {
			"Account Information": {
				purpose: "To authenticate you, send service notifications, and provide customer support",
				lawfulBasis: LegalBases.Contract,
				retention: "Until account deletion",
				provision: ContractPrerequisite("We cannot create or operate your account."),
			},
			"Session Data": {
				purpose: "To secure sessions, detect abuse, and diagnose service issues",
				lawfulBasis: LegalBases.LegitimateInterests,
				retention: "Until session expiry",
				provision: ContractPrerequisite("We cannot secure the service or your session."),
			},
			"Usage Data": {
				purpose: "To understand how the product is used and improve the experience",
				lawfulBasis: LegalBases.LegitimateInterests,
				retention: "13 months",
				provision: ContractPrerequisite(
					"We cannot understand product usage to improve the service.",
				),
			},
		},
	},
	cookies: {
		used: {
			essential: true,
			analytics: true,
			marketing: false,
		},
		context: {
			essential: { lawfulBasis: LegalBases.LegalObligation },
			analytics: { lawfulBasis: LegalBases.Consent },
			marketing: { lawfulBasis: LegalBases.Consent },
		},
	},
	thirdParties: [],
	automatedDecisionMaking: [],
	// Runtime-only consent wiring. The banner's categories + locked flags are
	// derived from `cookies` above (analytics is Consent ⇒ a real toggle;
	// essential stays locked); only the storage adapter and jurisdiction
	// resolver are authored here. <PolicyStackProvider> reads this and spins
	// up the consent store — no separate config, no toOpenCookiesConfig call.
	consent: {
		adapter: localStorageAdapter(),
		jurisdictionResolver: timezoneResolver(),
	},
});
