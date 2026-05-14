import type { LegalBasis, ProvisionBasis, UserRight } from "../types";

// The Dictionary type is the contract every locale must satisfy.
// Each leaf is a function so interpolation variables are typed parameters
// (no string-template parser, no runtime path resolver — tsc is the lookup).
//
// Sub-objects keyed by union types (LegalBasis, ProvisionBasis, UserRight,
// CookieCategory, CookieType) force every locale to translate every member.
// Lookup tables that may also receive user-defined keys (cookie categories
// beyond the four defaults) keep a fallback in the builder; the dictionary
// only covers known keys.
export type CookieCategory = "essential" | "analytics" | "functional" | "marketing";

export type CookieType = "essential" | "analytics" | "functional" | "marketing";

export type Dictionary = {
	shared: {
		versionSuffix: (vars: { version: string }) => string;
		contactLabels: {
			legalName: () => string;
			address: () => string;
			email: () => string;
			phone: () => string;
			dpo: () => string;
		};
		legalBasisLabels: Record<LegalBasis, () => string>;
	};
	privacy: {
		introduction: {
			heading: () => string;
			body: (vars: { companyName: string; effectiveDate: string; versionSuffix: string }) => string;
			contactLine: (vars: { contactEmail: string }) => string;
		};
		childrenPrivacy: {
			heading: () => string;
			body: (vars: { underAge: number }) => string;
			noticeLinkPrefix: () => string;
			noticeLinkText: () => string;
		};
		dataCollected: {
			heading: () => string;
			intro: {
				withGdpr: () => string;
				withoutGdpr: () => string;
			};
			headers: {
				withGdpr: () => [string, string, string, string];
				withoutGdpr: () => [string, string, string];
			};
		};
		consentWithdrawal: {
			heading: () => string;
			body: (vars: { contactEmail: string }) => string;
		};
		automatedDecisionMaking: {
			heading: () => string;
			empty: () => string;
			intro: () => string;
			significanceLabel: () => string;
			humanReview: {
				label: () => string;
				body: (vars: { contactEmail: string }) => string;
			};
		};
		dataRetention: {
			heading: () => string;
			intro: () => string;
			headers: () => [string, string];
		};
		provisionRequirement: {
			heading: () => string;
			body: () => string;
			headers: () => [string, string, string];
		};
		cookies: {
			heading: () => string;
			empty: () => string;
			intro: () => string;
			headers: () => [string, string];
		};
		thirdParties: {
			heading: () => string;
			empty: () => string;
			intro: () => string;
			headers: () => [string, string, string];
			linkText: () => string;
		};
		userRights: {
			heading: () => string;
			intro: () => string;
			labels: Record<UserRight, () => string>;
		};
		dpo: {
			present: {
				trailing: () => string;
			};
			absentRequiredFalse: (vars: { reason: string }) => string;
			absentFallback: () => string;
		};
		euRepresentative: {
			body: (vars: { name: string; address: string; email: string }) => {
				prefix: string;
				suffix: string;
			};
		};
		gdprSupplement: {
			heading: () => string;
			scope: () => string;
			dataControllerLabel: () => string;
			complaintBody: {
				prefix: () => string;
				linkText: () => string;
				suffix: () => string;
			};
			transferBody: {
				prefix: () => string;
				adequacyLinkText: () => string;
				middle: () => string;
				email: (vars: { contactEmail: string }) => string;
			};
		};
		ukGdprSupplement: {
			heading: () => string;
			scope: () => string;
			dataControllerLabel: () => string;
			ico: {
				prefix: () => string;
				label: () => string;
				suffix: () => string;
				linkText: () => string;
				suffix2: () => string;
			};
			transferBody: () => string;
		};
		ccpaSupplement: {
			heading: () => string;
			intro: () => string;
			rights: {
				know: () => string;
				delete: () => string;
				optOut: () => string;
				nonDiscrimination: () => string;
			};
			submitting: {
				label: () => string;
				body: () => string;
			};
		};
		contact: {
			heading: () => string;
			intro: () => string;
		};
		provisionBasisLabels: Record<ProvisionBasis, () => string>;
		cookieCategoryLabels: Record<CookieCategory, () => string>;
		cookieCategoryFallback: (vars: { key: string }) => string;
	};
	cookie: {
		introduction: {
			heading: () => string;
			body: (vars: { companyName: string; effectiveDate: string; versionSuffix: string }) => string;
		};
		whatAreCookies: {
			heading: () => string;
			body1: () => string;
			body2: () => string;
		};
		types: {
			heading: () => string;
			empty: () => string;
			headers: () => [string, string];
			labels: Record<CookieType, { label: () => string; description: () => string }>;
			fallback: (vars: { key: string }) => { label: string; description: string };
		};
		trackingTechnologies: {
			heading: () => string;
			intro: () => string;
		};
		thirdParties: {
			heading: () => string;
			intro: () => string;
			headers: () => [string, string, string];
			linkText: () => string;
		};
		consent: {
			heading: () => string;
			banner: () => string;
			panel: () => string;
			withdraw: () => string;
		};
		managing: {
			heading: () => string;
			intro: () => string;
			items: {
				delete: () => string;
				block: () => string;
				notify: () => string;
			};
			footer: () => string;
		};
		jurisdictionEuUk: {
			heading: {
				euAndUk: () => string;
				eu: () => string;
				uk: () => string;
			};
			body: (vars: { region: string }) => string;
			region: {
				euAndUk: () => string;
				eu: () => string;
				uk: () => string;
			};
			essentialBody: () => string;
		};
		contact: {
			heading: () => string;
			intro: () => string;
		};
	};
};
