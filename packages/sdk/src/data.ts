import type { LegalBasis } from "@policystack/core";

export const DataCategories = {
	AccountInfo: { "Account Information": ["Name", "Email address"] },
	SessionData: {
		"Session Data": ["IP address", "User agent", "Browser type"],
	},
	PaymentInfo: {
		"Payment Information": ["Card last 4 digits", "Billing name", "Billing address"],
	},
	UsageData: {
		"Usage Data": ["Pages visited", "Features used", "Time spent"],
	},
	DeviceInfo: {
		"Device Information": ["Device type", "Operating system", "Browser version"],
	},
	LocationData: { "Location Data": ["Country", "City", "Timezone"] },
	Communications: {
		Communications: ["Email content", "Support tickets"],
	},
} as const;

export const Retention = {
	UntilAccountDeletion: "Until account deletion",
	UntilSessionExpiry: "Until session expiry",
	ThirtyDays: "30 days",
	NinetyDays: "90 days",
	OneYear: "1 year",
	ThreeYears: "3 years",
	AsRequiredByLaw: "As required by applicable law",
} as const;

export const LegalBases = {
	Consent: "consent",
	Contract: "contract",
	LegalObligation: "legal_obligation",
	VitalInterests: "vital_interests",
	PublicTask: "public_task",
	LegitimateInterests: "legitimate_interests",
} as const satisfies Record<string, LegalBasis>;
