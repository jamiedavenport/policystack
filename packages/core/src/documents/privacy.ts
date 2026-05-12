import type { PrivacyPolicyConfig } from "../types";
import { bold, cell, heading, li, link, p, row, section, table, ul } from "./helpers";
import type { ContentNode, DocumentSection, InlineNode, ListItemNode, TableRowNode } from "./types";

const LEGAL_BASIS_LABELS: Record<string, string> = {
	consent: "Consent (Article 6(1)(a))",
	contract: "Performance of a contract (Article 6(1)(b))",
	legal_obligation: "Compliance with a legal obligation (Article 6(1)(c))",
	vital_interests: "Protection of vital interests (Article 6(1)(d))",
	public_task: "Performance of a public task (Article 6(1)(e))",
	legitimate_interests: "Legitimate interests (Article 6(1)(f))",
};

const PROVISION_BASIS_LABELS: Record<string, string> = {
	statutory: "Required by law",
	contractual: "Required under our contract with you",
	"contract-prerequisite": "Required to enter into a contract",
	voluntary: "Voluntary",
};

const RIGHTS_LABELS: Record<string, string> = {
	access: "Right to access your personal data",
	rectification: "Right to correct inaccurate data",
	erasure: "Right to request deletion of your data",
	portability: "Right to receive your data in a portable format",
	restriction: "Right to restrict how we process your data",
	objection: "Right to object to processing",
	opt_out_sale: "Right to opt out of the sale of your personal information",
	non_discrimination: "Right to non-discriminatory treatment for exercising your rights",
};

function buildIntroduction(config: PrivacyPolicyConfig): DocumentSection {
	const versionSuffix = config.version ? ` Version: ${config.version}.` : "";
	return section("introduction", [
		heading("Introduction"),
		p([
			`This Privacy Policy describes how ${config.company.name} ("we", "us", or "our") collects, uses, and shares information about you when you use our services. Effective Date: ${config.effectiveDate}.${versionSuffix}`,
		]),
		p([
			`If you have questions about this policy, please contact us at ${config.company.contact.email}.`,
		]),
	]);
}

function buildChildrenPrivacy(config: PrivacyPolicyConfig): DocumentSection | null {
	if (!config.children) return null;
	const { underAge, noticeUrl } = config.children;
	return section("children-privacy", [
		heading("Children's Privacy", { reason: "Required by COPPA" }),
		p([
			`Our services are not directed to children under the age of ${underAge}. We do not knowingly collect personal information from children under ${underAge}. If you believe we have collected information from a child, please contact us immediately.`,
		]),
		...(noticeUrl
			? [p(["For more information, see our ", link(noticeUrl, "Children's Privacy Notice"), "."])]
			: []),
	]);
}

function buildDataCollected(config: PrivacyPolicyConfig): DocumentSection {
	const { collected, context } = config.data;
	const includeLegalBasis =
		config.jurisdictions.includes("eu") || config.jurisdictions.includes("uk");
	const rows: TableRowNode[] = Object.entries(collected).map(([category, fields]) => {
		const entry = context[category];
		if (!entry?.purpose) {
			throw new Error(
				`OpenPolicy: data.collected["${category}"] has no matching entry in data.context. ` +
					"Every collected category must declare its processing purpose (GDPR Art. 13(1)(c)).",
			);
		}
		const cells = [cell([bold(category)]), cell([fields.join(", ")]), cell([entry.purpose])];
		if (includeLegalBasis) {
			const label = LEGAL_BASIS_LABELS[entry.lawfulBasis] ?? entry.lawfulBasis;
			cells.push(cell([label]));
		}
		return row(cells);
	});
	const headerLabels = includeLegalBasis
		? ["Category", "Fields collected", "Purpose", "Lawful basis"]
		: ["Category", "Fields collected", "Purpose"];
	const intro = includeLegalBasis
		? "We collect the following categories of personal data for the purposes described below. Under GDPR Article 6, we rely on the lawful bases shown for each processing purpose:"
		: "We collect the following categories of personal data for the purposes described below:";
	const reason = includeLegalBasis
		? "Required by GDPR Article 13(1)(c) and Article 6"
		: "Required by GDPR Article 13(1)(c)";
	return section("data-collected", [
		heading("Information We Collect", { reason }),
		p([intro]),
		table(headerLabels, rows),
	]);
}

function usesConsent(config: PrivacyPolicyConfig): boolean {
	if (Object.values(config.data.context).some((e) => e.lawfulBasis === "consent")) return true;
	if (Object.values(config.cookies.context).some((e) => e.lawfulBasis === "consent")) return true;
	return false;
}

function buildConsentWithdrawal(config: PrivacyPolicyConfig): DocumentSection | null {
	if (!config.jurisdictions.includes("eu") && !config.jurisdictions.includes("uk")) return null;
	if (!usesConsent(config)) return null;
	return section("consent-withdrawal", [
		heading("Right to Withdraw Consent", {
			reason: "Required by GDPR Article 7(3) and Article 13(2)(c)",
		}),
		p([
			`Where we rely on your consent for any processing of your personal data, you have the right to withdraw that consent at any time by contacting us at ${config.company.contact.email}. Withdrawing your consent does not affect the lawfulness of any processing we carried out before you withdrew it. Where consent is required to provide a particular feature or service, withdrawing it may mean we are no longer able to offer that feature or service.`,
		]),
	]);
}

function buildAutomatedDecisionMaking(config: PrivacyPolicyConfig): DocumentSection | null {
	if (!config.jurisdictions.includes("eu") && !config.jurisdictions.includes("uk")) return null;
	const decisions = config.automatedDecisionMaking;
	if (decisions === undefined) return null;

	const content: ContentNode[] = [
		heading("Automated Decision-Making and Profiling", {
			reason: "Required by GDPR and UK-GDPR Article 13(2)(f) and Article 22",
		}),
	];

	if (decisions.length === 0) {
		content.push(
			p([
				"We do not engage in automated decision-making or profiling that produces legal effects concerning you or similarly significantly affects you within the meaning of GDPR Article 22.",
			]),
		);
		return section("automated-decision-making", content);
	}

	content.push(
		p([
			"We use the following automated processing that may produce legal effects concerning you or similarly significantly affect you. For each, we describe the logic involved and the significance and envisaged consequences:",
		]),
	);
	for (const d of decisions) {
		content.push(
			p([bold(d.name), " — ", d.logic, " ", bold("Significance:"), " ", d.significance]),
		);
	}
	content.push(
		p([
			bold("Right to human review."),
			` You have the right not to be subject to a decision based solely on automated processing, including profiling. To request human intervention, express your point of view, or contest a decision, contact us at ${config.company.contact.email}.`,
		]),
	);
	return section("automated-decision-making", content);
}

function buildDataRetention(config: PrivacyPolicyConfig): DocumentSection {
	const rows: TableRowNode[] = Object.entries(config.data.context).map(([category, entry]) =>
		row([cell([bold(category)]), cell([entry.retention])]),
	);
	return section("data-retention", [
		heading("Data Retention"),
		p(["We retain your data for the following periods:"]),
		table(["Category", "Retention period"], rows),
	]);
}

function buildProvisionRequirement(config: PrivacyPolicyConfig): DocumentSection | null {
	if (!config.jurisdictions.includes("eu") && !config.jurisdictions.includes("uk")) return null;
	const entries = Object.entries(config.data.context);
	if (entries.length === 0) return null;
	const rows: TableRowNode[] = entries.map(([category, entry]) => {
		const requirement = entry.provision;
		const label = PROVISION_BASIS_LABELS[requirement.basis] ?? requirement.basis;
		return row([cell([bold(category)]), cell([label]), cell([requirement.consequences])]);
	});
	return section("provision-requirement", [
		heading("Whether You Are Required to Provide This Data", {
			reason: "Required by GDPR and UK-GDPR Article 13(2)(e)",
		}),
		p([
			"For each category of personal data we collect, we set out below whether you are required to provide it — by law, under our contract with you, or as a precondition to entering into a contract — or whether provision is voluntary, together with the consequences of failing to provide it.",
		]),
		table(["Category", "Requirement", "Consequences"], rows),
	]);
}

const COOKIE_CATEGORY_LABELS: Record<string, string> = {
	essential: "Essential cookies — required for the service to function",
	analytics: "Analytics cookies — help us understand how the service is used",
	functional: "Functional cookies — remember your preferences and settings",
	marketing: "Marketing cookies — used to deliver relevant advertisements",
};

function cookieCategoryLabel(key: string): string {
	return COOKIE_CATEGORY_LABELS[key] ?? `${key} cookies`;
}

function buildCookies(config: PrivacyPolicyConfig): DocumentSection {
	const rows: TableRowNode[] = [];
	for (const [key, enabled] of Object.entries(config.cookies.used)) {
		if (!enabled) continue;
		const label = cookieCategoryLabel(key);
		const basis = config.cookies.context[key]?.lawfulBasis;
		rows.push(row([cell([label]), cell([basis ? (LEGAL_BASIS_LABELS[basis] ?? basis) : ""])]));
	}

	if (rows.length === 0) {
		return section("cookies", [
			heading("Cookies and Tracking"),
			p(["We do not use cookies or similar tracking technologies."]),
		]);
	}
	return section("cookies", [
		heading("Cookies and Tracking"),
		p(["We use the following types of cookies and tracking technologies:"]),
		table(["Category", "Lawful basis"], rows),
	]);
}

function buildThirdParties(config: PrivacyPolicyConfig): DocumentSection {
	if (config.thirdParties.length === 0) {
		return section("third-parties", [
			heading("Third-Party Services"),
			p([
				"We do not share your personal information with third parties except as required by law.",
			]),
		]);
	}
	const rows: TableRowNode[] = config.thirdParties.map((t) =>
		row([
			cell([bold(t.name)]),
			cell([t.purpose]),
			cell(t.policyUrl ? [link(t.policyUrl, "View")] : [""]),
		]),
	);
	return section("third-parties", [
		heading("Third-Party Services"),
		p(["We share data with the following third-party services:"]),
		table(["Service", "Purpose", "Privacy policy"], rows),
	]);
}

function buildUserRights(config: PrivacyPolicyConfig): DocumentSection | null {
	if (config.userRights.length === 0) return null;
	const items = config.userRights.map((right) => {
		const label = RIGHTS_LABELS[right] ?? right;
		return li([label]);
	});
	return section("user-rights", [
		heading("Your Rights"),
		p(["You have the following rights regarding your personal data:"]),
		ul(items),
	]);
}

function dpoParagraph(config: PrivacyPolicyConfig): ContentNode {
	const { dpo } = config.company;
	if (dpo && "email" in dpo) {
		const parts: (string | InlineNode)[] = [bold("Data Protection Officer:"), " "];
		if (dpo.name) parts.push(dpo.name, ", ");
		parts.push(dpo.email);
		if (dpo.phone) parts.push(", ", dpo.phone);
		if (dpo.address) parts.push(", ", dpo.address);
		parts.push(
			". You may contact our Data Protection Officer directly with any questions about this policy or how we handle your personal data.",
		);
		return p(parts);
	}
	if (dpo && "required" in dpo && dpo.required === false) {
		const trailing = dpo.reason ? ` ${dpo.reason}` : "";
		return p([
			`We have not appointed a Data Protection Officer. Our processing activities do not meet the thresholds in GDPR Article 37(1) that would require one.${trailing}`,
		]);
	}
	return p([
		"We have not appointed a Data Protection Officer. Our processing activities do not meet the thresholds in GDPR Article 37(1) that would require one. For any questions about this policy or how we handle your personal data, please use the contact details above.",
	]);
}

function euRepresentativeParagraph(config: PrivacyPolicyConfig): ContentNode | null {
	const rep = config.company.euRepresentative;
	if (!rep) return null;
	return p([
		"Our representative in the European Union for the purposes of Article 27 GDPR is ",
		bold(rep.name),
		`, ${rep.address}, ${rep.email}.`,
	]);
}

function buildGdprSupplement(config: PrivacyPolicyConfig): DocumentSection | null {
	if (!config.jurisdictions.includes("eu")) return null;
	const content: ContentNode[] = [
		heading("GDPR Supplemental Disclosures", {
			reason: "Required by GDPR Article 13",
		}),
		p([
			"This section applies to individuals in the European Economic Area (EEA) under the General Data Protection Regulation (GDPR).",
		]),
		p(["Data Controller: ", bold(config.company.legalName), `, ${config.company.address}`]),
		dpoParagraph(config),
		p([
			"You have the right to lodge a complaint with the data protection supervisory authority in your country of residence, place of work, or place of the alleged infringement. A list of EEA supervisory authorities is available at ",
			link(
				"https://edpb.europa.eu/about-edpb/about-edpb/members_en",
				"edpb.europa.eu/about-edpb/about-edpb/members_en",
			),
			".",
		]),
		p([
			"Where we transfer your personal data outside the EEA, we rely on one or more of the safeguards permitted under Chapter V of the GDPR: (a) transfers to countries the European Commission has determined provide an adequate level of data protection (the current list is published at ",
			link(
				"https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en",
				"commission.europa.eu/.../adequacy-decisions_en",
			),
			"); (b) Standard Contractual Clauses (SCCs) adopted by the European Commission under Article 46(2)(c); and (c) Binding Corporate Rules approved under Article 47 where applicable. You may request further information about the specific safeguards applied to a particular transfer by contacting us at ",
			config.company.contact.email,
			".",
		]),
	];
	const rep = euRepresentativeParagraph(config);
	if (rep) content.push(rep);
	return section("gdpr-supplement", content);
}

function buildUkGdprSupplement(config: PrivacyPolicyConfig): DocumentSection | null {
	if (!config.jurisdictions.includes("uk")) return null;
	return section("uk-gdpr-supplement", [
		heading("UK Privacy Rights (UK-GDPR)", {
			reason: "Required by the UK-GDPR and Data Protection Act 2018",
		}),
		p([
			"This section applies to individuals in the United Kingdom under the UK General Data Protection Regulation (UK-GDPR), as tailored by the Data Protection Act 2018.",
		]),
		p(["Data Controller: ", bold(config.company.legalName), `, ${config.company.address}`]),
		dpoParagraph(config),
		p([
			"The supervisory authority for data protection in the UK is the ",
			bold("Information Commissioner's Office (ICO)"),
			". If you believe we have not handled your data in accordance with UK data protection law, you have the right to lodge a complaint with the ICO at ",
			link("https://ico.org.uk/make-a-complaint/", "ico.org.uk/make-a-complaint"),
			".",
		]),
		p([
			"If we transfer your personal data outside the United Kingdom, we ensure appropriate safeguards are in place in accordance with the UK-GDPR, including the UK International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses where applicable.",
		]),
	]);
}

function buildCcpaSupplement(config: PrivacyPolicyConfig): DocumentSection | null {
	if (!config.jurisdictions.includes("us-ca")) return null;
	const { email, phone } = config.company.contact;
	const submissionMethods: ListItemNode[] = [li([bold("Email:"), " ", email])];
	if (phone) submissionMethods.push(li([bold("Phone:"), " ", phone]));
	return section("ccpa-supplement", [
		heading("California Privacy Rights (CCPA)", { reason: "Required by CCPA" }),
		p(["If you are a California resident, you have the following additional rights:"]),
		ul([
			li([
				"Right to Know — You may request disclosure of the personal information we collect, use, and share about you.",
			]),
			li([
				"Right to Delete — You may request deletion of personal information we have collected about you.",
			]),
			li(["Right to Opt-Out — You may opt out of the sale of your personal information."]),
			li([
				"Right to Non-Discrimination — We will not discriminate against you for exercising your CCPA rights.",
			]),
		]),
		p([
			bold("Submitting requests."),
			" To exercise any of these rights, contact us using one of the methods below. We will respond within the timeframes required by CCPA §1798.130.",
		]),
		ul(submissionMethods),
	]);
}

function buildContact(config: PrivacyPolicyConfig): DocumentSection {
	const items = [
		li([bold("Legal Name:"), " ", config.company.legalName]),
		li([bold("Address:"), " ", config.company.address]),
		li([bold("Email:"), " ", config.company.contact.email]),
	];
	if (config.company.contact.phone) {
		items.push(li([bold("Phone:"), " ", config.company.contact.phone]));
	}
	const { dpo } = config.company;
	if (dpo && "email" in dpo) {
		const dpoParts: (string | InlineNode)[] = [bold("Data Protection Officer:"), " "];
		if (dpo.name) dpoParts.push(dpo.name, ", ");
		dpoParts.push(dpo.email);
		if (dpo.phone) dpoParts.push(", ", dpo.phone);
		if (dpo.address) dpoParts.push(", ", dpo.address);
		items.push(li(dpoParts));
	}
	return section("contact", [heading("Contact Us"), p(["Contact us:"]), ul(items)]);
}

const SECTION_BUILDERS: ((config: PrivacyPolicyConfig) => DocumentSection | null)[] = [
	buildIntroduction,
	buildChildrenPrivacy,
	buildDataCollected,
	buildConsentWithdrawal,
	buildAutomatedDecisionMaking,
	buildDataRetention,
	buildProvisionRequirement,
	buildCookies,
	buildThirdParties,
	buildUserRights,
	buildGdprSupplement,
	buildUkGdprSupplement,
	buildCcpaSupplement,
	buildContact,
];

export function compilePrivacyDocument(config: PrivacyPolicyConfig): DocumentSection[] {
	if (Object.keys(config.data.collected).length === 0) {
		throw new Error(
			"OpenPolicy: cannot compile a privacy policy with no data collected. " +
				"Populate `data.collected` in your config, or instrument `collecting()` calls and use the `openPolicy()` Vite plugin.",
		);
	}
	return SECTION_BUILDERS.map((builder) => builder(config)).filter(
		(s): s is DocumentSection => s !== null,
	);
}
