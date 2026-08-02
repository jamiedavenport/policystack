import { ContractPrerequisite, defineConfig, LegalBases } from "@policystack/sdk";
import { timezoneResolver } from "@policystack/core/consent";
import { localStorageAdapter } from "@policystack/core/consent/storage/local-storage";

export default defineConfig({
	company: {
		name: "PolicyStack",
		legalName: "PolicyStack Ltd",
		address: "86-90 Paul Street, London, EC2A 4NE, United Kingdom",
		contact: { email: "jamie@policystack.dev" },
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
			essential: {
				lawfulBasis: LegalBases.LegalObligation,
				label: "Essential",
				description:
					"Required for the site to work — security, session, and your consent choice itself. Always on.",
			},
			analytics: {
				lawfulBasis: LegalBases.Consent,
				label: "Analytics",
				description:
					"Lets us measure which pages are used so we can improve the site. Off until you allow it.",
			},
			marketing: {
				lawfulBasis: LegalBases.Consent,
				label: "Marketing",
				description: "Used to personalise and measure marketing. Off until you allow it.",
			},
		},
	},
	thirdParties: [],
	automatedDecisionMaking: [],
	// Runtime-only consent wiring. The banner's categories + locked flags are
	// derived from `cookies` above (analytics is Consent ⇒ a real toggle;
	// essential stays locked); only the storage adapter and jurisdiction
	// resolver are authored here. The single <PolicyStack> provider reads this
	// whole config and spins up the consent store — no separate config, no
	// conversion step.
	consent: {
		adapter: localStorageAdapter(),
		jurisdictionResolver: timezoneResolver(),
	},
});
