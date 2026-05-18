import type { Dictionary } from "./types";

export const en: Dictionary = {
	shared: {
		versionSuffix: ({ version }) => ` Version: ${version}.`,
		contactLabels: {
			legalName: () => "Legal Name:",
			address: () => "Address:",
			email: () => "Email:",
			url: () => "Website:",
			phone: () => "Phone:",
			dpo: () => "Data Protection Officer:",
		},
		legalBasisLabels: {
			consent: () => "Consent (Article 6(1)(a))",
			contract: () => "Performance of a contract (Article 6(1)(b))",
			legal_obligation: () => "Compliance with a legal obligation (Article 6(1)(c))",
			vital_interests: () => "Protection of vital interests (Article 6(1)(d))",
			public_task: () => "Performance of a public task (Article 6(1)(e))",
			legitimate_interests: () => "Legitimate interests (Article 6(1)(f))",
		},
	},
	privacy: {
		introduction: {
			heading: () => "Introduction",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`This Privacy Policy describes how ${companyName} ("we", "us", or "our") collects, uses, and shares information about you when you use our services. Effective Date: ${effectiveDate}.${versionSuffix}`,
			contactLine: ({ contactEmail }) =>
				`If you have questions about this policy, please contact us at ${contactEmail}.`,
		},
		childrenPrivacy: {
			heading: () => "Children's Privacy",
			body: ({ underAge }) =>
				`Our services are not directed to children under the age of ${underAge}. We do not knowingly collect personal information from children under ${underAge}. If you believe we have collected information from a child, please contact us immediately.`,
			noticeLinkPrefix: () => "For more information, see our ",
			noticeLinkText: () => "Children's Privacy Notice",
		},
		dataCollected: {
			heading: () => "Information We Collect",
			intro: {
				withGdpr: () =>
					"We collect the following categories of personal data for the purposes described below. Under GDPR Article 6, we rely on the lawful bases shown for each processing purpose:",
				withoutGdpr: () =>
					"We collect the following categories of personal data for the purposes described below:",
			},
			headers: {
				withGdpr: () => ["Category", "Fields collected", "Purpose", "Lawful basis"],
				withoutGdpr: () => ["Category", "Fields collected", "Purpose"],
			},
		},
		consentWithdrawal: {
			heading: () => "Right to Withdraw Consent",
			body: ({ contactEmail }) =>
				`Where we rely on your consent for any processing of your personal data, you have the right to withdraw that consent at any time by contacting us at ${contactEmail}. Withdrawing your consent does not affect the lawfulness of any processing we carried out before you withdrew it. Where consent is required to provide a particular feature or service, withdrawing it may mean we are no longer able to offer that feature or service.`,
		},
		automatedDecisionMaking: {
			heading: () => "Automated Decision-Making and Profiling",
			empty: () =>
				"We do not engage in automated decision-making or profiling that produces legal effects concerning you or similarly significantly affects you within the meaning of GDPR Article 22.",
			intro: () =>
				"We use the following automated processing that may produce legal effects concerning you or similarly significantly affect you. For each, we describe the logic involved and the significance and envisaged consequences:",
			significanceLabel: () => "Significance:",
			humanReview: {
				label: () => "Right to human review.",
				body: ({ contactEmail }) =>
					` You have the right not to be subject to a decision based solely on automated processing, including profiling. To request human intervention, express your point of view, or contest a decision, contact us at ${contactEmail}.`,
			},
		},
		dataRetention: {
			heading: () => "Data Retention",
			intro: () => "We retain your data for the following periods:",
			headers: () => ["Category", "Retention period"],
		},
		provisionRequirement: {
			heading: () => "Whether You Are Required to Provide This Data",
			body: () =>
				"For each category of personal data we collect, we set out below whether you are required to provide it — by law, under our contract with you, or as a precondition to entering into a contract — or whether provision is voluntary, together with the consequences of failing to provide it.",
			headers: () => ["Category", "Requirement", "Consequences"],
		},
		cookies: {
			heading: () => "Cookies and Tracking",
			empty: () => "We do not use cookies or similar tracking technologies.",
			intro: () => "We use the following types of cookies and tracking technologies:",
			headers: () => ["Category", "Lawful basis"],
		},
		thirdParties: {
			heading: () => "Third-Party Services",
			empty: () =>
				"We do not share your personal information with third parties except as required by law.",
			intro: () => "We share data with the following third-party services:",
			headers: () => ["Service", "Purpose", "Privacy policy"],
			linkText: () => "View",
		},
		userRights: {
			heading: () => "Your Rights",
			intro: () => "You have the following rights regarding your personal data:",
			labels: {
				access: () => "Right to access your personal data",
				rectification: () => "Right to correct inaccurate data",
				erasure: () => "Right to request deletion of your data",
				portability: () => "Right to receive your data in a portable format",
				restriction: () => "Right to restrict how we process your data",
				objection: () => "Right to object to processing",
				opt_out_sale: () => "Right to opt out of the sale of your personal information",
				non_discrimination: () =>
					"Right to non-discriminatory treatment for exercising your rights",
			},
		},
		dpo: {
			present: {
				trailing: () =>
					". You may contact our Data Protection Officer directly with any questions about this policy or how we handle your personal data.",
			},
			absentRequiredFalse: ({ reason }) =>
				`We have not appointed a Data Protection Officer. Our processing activities do not meet the thresholds in GDPR Article 37(1) that would require one.${reason}`,
			absentFallback: () =>
				"We have not appointed a Data Protection Officer. Our processing activities do not meet the thresholds in GDPR Article 37(1) that would require one. For any questions about this policy or how we handle your personal data, please use the contact details above.",
		},
		euRepresentative: {
			body: ({ address, email }) => ({
				prefix: "Our representative in the European Union for the purposes of Article 27 GDPR is ",
				suffix: `, ${address}, ${email}.`,
			}),
		},
		gdprSupplement: {
			heading: () => "GDPR Supplemental Disclosures",
			scope: () =>
				"This section applies to individuals in the European Economic Area (EEA) under the General Data Protection Regulation (GDPR).",
			dataControllerLabel: () => "Data Controller: ",
			complaintBody: {
				prefix: () =>
					"You have the right to lodge a complaint with the data protection supervisory authority in your country of residence, place of work, or place of the alleged infringement. A list of EEA supervisory authorities is available at ",
				linkText: () => "edpb.europa.eu/about-edpb/about-edpb/members_en",
				suffix: () => ".",
			},
			transferBody: {
				prefix: () =>
					"Where we transfer your personal data outside the EEA, we rely on one or more of the safeguards permitted under Chapter V of the GDPR: (a) transfers to countries the European Commission has determined provide an adequate level of data protection (the current list is published at ",
				adequacyLinkText: () => "commission.europa.eu/.../adequacy-decisions_en",
				middle: () =>
					"); (b) Standard Contractual Clauses (SCCs) adopted by the European Commission under Article 46(2)(c); and (c) Binding Corporate Rules approved under Article 47 where applicable. You may request further information about the specific safeguards applied to a particular transfer by contacting us at ",
				email: ({ contactEmail }) => `${contactEmail}.`,
			},
		},
		ukGdprSupplement: {
			heading: () => "UK Privacy Rights (UK-GDPR)",
			scope: () =>
				"This section applies to individuals in the United Kingdom under the UK General Data Protection Regulation (UK-GDPR), as tailored by the Data Protection Act 2018.",
			dataControllerLabel: () => "Data Controller: ",
			ico: {
				prefix: () => "The supervisory authority for data protection in the UK is the ",
				label: () => "Information Commissioner's Office (ICO)",
				suffix: () =>
					". If you believe we have not handled your data in accordance with UK data protection law, you have the right to lodge a complaint with the ICO at ",
				linkText: () => "ico.org.uk/make-a-complaint",
				suffix2: () => ".",
			},
			transferBody: () =>
				"If we transfer your personal data outside the United Kingdom, we ensure appropriate safeguards are in place in accordance with the UK-GDPR, including the UK International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses where applicable.",
		},
		ccpaSupplement: {
			heading: () => "California Privacy Rights (CCPA)",
			intro: () => "If you are a California resident, you have the following additional rights:",
			rights: {
				know: () =>
					"Right to Know — You may request disclosure of the personal information we collect, use, and share about you.",
				delete: () =>
					"Right to Delete — You may request deletion of personal information we have collected about you.",
				optOut: () =>
					"Right to Opt-Out — You may opt out of the sale of your personal information.",
				nonDiscrimination: () =>
					"Right to Non-Discrimination — We will not discriminate against you for exercising your CCPA rights.",
			},
			submitting: {
				label: () => "Submitting requests.",
				body: () =>
					" To exercise any of these rights, contact us using one of the methods below. We will respond within the timeframes required by CCPA §1798.130.",
			},
		},
		contact: {
			heading: () => "Contact Us",
			intro: () => "Contact us:",
		},
		provisionBasisLabels: {
			statutory: () => "Required by law",
			contractual: () => "Required under our contract with you",
			"contract-prerequisite": () => "Required to enter into a contract",
			voluntary: () => "Voluntary",
		},
		cookieCategoryLabels: {
			essential: () => "Essential cookies — required for the service to function",
			analytics: () => "Analytics cookies — help us understand how the service is used",
			functional: () => "Functional cookies — remember your preferences and settings",
			marketing: () => "Marketing cookies — used to deliver relevant advertisements",
		},
		cookieCategoryFallback: ({ key }) => `${key} cookies`,
	},
	cookie: {
		introduction: {
			heading: () => "Cookie Policy",
			body: ({ companyName, effectiveDate, versionSuffix }) =>
				`This Cookie Policy explains how ${companyName} ("we", "us", or "our") uses cookies and similar tracking technologies on our services. Effective Date: ${effectiveDate}.${versionSuffix}`,
		},
		whatAreCookies: {
			heading: () => "What Are Cookies?",
			body1: () =>
				"Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work more efficiently and to provide information to site owners.",
			body2: () =>
				'Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (remain on your device until they expire or you delete them).',
		},
		types: {
			heading: () => "Types of Cookies We Use",
			empty: () => "We do not currently use any cookies.",
			headers: () => ["Type", "Description"],
			labels: {
				essential: {
					label: () => "Essential Cookies",
					description: () =>
						"Required for the basic functioning of our services. These cannot be disabled.",
				},
				analytics: {
					label: () => "Analytics Cookies",
					description: () =>
						"Help us understand how visitors interact with our services so we can improve them.",
				},
				functional: {
					label: () => "Functional Cookies",
					description: () =>
						"Enable enhanced functionality and personalisation, such as remembering your preferences.",
				},
				marketing: {
					label: () => "Marketing Cookies",
					description: () =>
						"Used to deliver advertisements more relevant to you and your interests.",
				},
			},
			fallback: ({ key }) => ({
				label: `${key.charAt(0).toUpperCase()}${key.slice(1)} Cookies`,
				description: "",
			}),
		},
		trackingTechnologies: {
			heading: () => "Other Tracking Technologies",
			intro: () => "In addition to cookies, we may use the following tracking technologies:",
		},
		thirdParties: {
			heading: () => "Third-Party Cookies",
			intro: () => "The following third parties may set cookies through our services:",
			headers: () => ["Service", "Purpose", "Privacy policy"],
			linkText: () => "View",
		},
		consent: {
			heading: () => "Your Consent",
			banner: () => "We display a cookie consent banner when you first visit our services.",
			panel: () => "You can manage your cookie preferences at any time via our preference panel.",
			withdraw: () =>
				"You may withdraw your consent at any time; however, this will not affect the lawfulness of processing based on consent before its withdrawal.",
		},
		managing: {
			heading: () => "Managing Cookies",
			intro: () =>
				"Most web browsers allow you to control cookies through their settings. You can:",
			items: {
				delete: () => "Delete cookies already stored on your device",
				block: () => "Block cookies from being set on your device",
				notify: () => "Set your browser to notify you when a cookie is being set",
			},
			footer: () =>
				"Please note that restricting cookies may impact the functionality of our services. Consult your browser's help documentation for instructions on managing cookies.",
		},
		jurisdictionEuUk: {
			heading: {
				euAndUk: () => "European and UK Users (GDPR / UK-GDPR)",
				eu: () => "European Users (GDPR)",
				uk: () => "UK Users (UK-GDPR)",
			},
			body: ({ region }) =>
				`If you are located in the ${region}, we rely on your consent as our legal basis for setting non-essential cookies. You have the right to withdraw consent at any time.`,
			region: {
				euAndUk: () => "European Economic Area or the United Kingdom",
				eu: () => "European Economic Area",
				uk: () => "United Kingdom",
			},
			essentialBody: () =>
				"Essential cookies are set on the basis of our legitimate interests to provide you with a functioning service.",
		},
		contact: {
			heading: () => "Contact Us",
			intro: () => "If you have questions about this Cookie Policy, please contact us:",
		},
	},
};
