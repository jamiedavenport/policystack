// The canonical PolicyStack config. One `defineConfig()` is the single source
// of truth: it generates the privacy + cookie policy documents AND derives the
// consent runtime (categories, gating, re-prompt) consumed by
// `<PolicyStack>` in src/routes/__root.tsx. The only thing that differs
// per framework is that provider wiring — the config below is framework-neutral.
//
// Scanned data categories, cookies and third parties come from ./policystack.gen,
// which the `policyStack()` Vite plugin generates by scanning the source. They
// are merged in by passing the module as defineConfig's second argument — no
// hand-spreading. This file is also the project's scanner regression net —
// keep the `policystack.gen` import.
import { ContractPrerequisite, defineConfig, LegalBases } from "@policystack/sdk";
import * as scanned from "./policystack.gen";

export default defineConfig(
	{
		// Your legal entity — printed verbatim in both policies. `url` is the new
		// company.url field (rendered in the contact section); `name`/`url`/
		// `contact.email` would otherwise be seeded from package.json when omitted.
		company: {
			name: "Acme Inc.",
			legalName: "Acme Corporation",
			address: "123 Main St, Springfield, USA",
			url: "https://acme.example",
			contact: { email: "privacy@acme.com" },
		},
		effectiveDate: "2026-03-03",
		// Jurisdictions served, as SDK codes — drives the disclosures rendered.
		jurisdictions: ["eea", "us-ca"],
		// Personal data: `collected` is the manually declared categories → fields
		// map; scanned categories are merged in from the second defineConfig
		// argument. `context` gives each category its purpose, lawful basis and
		// retention — required for scanned categories too (the gen module's typed
		// augmentation enforces it).
		data: {
			collected: {
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
		// Cookies: the consent runtime is DERIVED from this block. Each enabled
		// `used` key becomes a consent category; its `lawfulBasis` decides locked
		// vs. consent-gated (LegalObligation ⇒ always on; Consent ⇒ gated). Scanned
		// cookies (here just `essential`) are merged in from the second defineConfig
		// argument — declaring a category the app never sets is a build-time drift
		// error, so this example honestly uses only an essential cookie.
		// `consentMechanism` is DERIVED from this posture (a consent-gated category
		// ⇒ banner + preference panel + withdrawal) — it is no longer hand-written,
		// so it can't be a lie. Essential-only ⇒ no consent mechanism is generated.
		cookies: {
			used: { essential: true },
			context: {
				essential: { lawfulBasis: LegalBases.LegalObligation },
			},
		},
		trackingTechnologies: ["web beacons", "local storage"],
		children: { underAge: 16, noticeUrl: "https://acme.com/parental-notice" },
		automatedDecisionMaking: [],
	},
	scanned,
);
