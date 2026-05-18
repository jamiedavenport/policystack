import type { T } from "../i18n";
import { formatDate } from "../i18n";
import type { PrivacyPolicyConfig } from "../types";
import { bold, cell, heading, li, link, p, row, section, table, ul } from "./helpers";
import type {
	ComplianceReason,
	ContentNode,
	DocumentSection,
	InlineNode,
	ListItemNode,
	TableRowNode,
} from "./types";

function versionSuffix(config: PrivacyPolicyConfig, t: T): string {
	return config.version ? t.shared.versionSuffix({ version: config.version }) : "";
}

function buildIntroduction(config: PrivacyPolicyConfig, t: T): DocumentSection {
	return section("introduction", [
		heading(t.privacy.introduction.heading()),
		p([
			t.privacy.introduction.body({
				companyName: config.company.name,
				effectiveDate: formatDate(config.effectiveDate, config.locale),
				versionSuffix: versionSuffix(config, t),
			}),
		]),
		p([t.privacy.introduction.contactLine({ contactEmail: config.company.contact.email })]),
	]);
}

function buildChildrenPrivacy(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (!config.children) return null;
	const { underAge, noticeUrl } = config.children;
	return section("children-privacy", [
		heading(t.privacy.childrenPrivacy.heading(), {
			reason: {
				code: "children-privacy",
				jurisdiction: "us",
				citation: "Required by COPPA",
			},
		}),
		p([t.privacy.childrenPrivacy.body({ underAge })]),
		...(noticeUrl
			? [
					p([
						t.privacy.childrenPrivacy.noticeLinkPrefix(),
						link(noticeUrl, t.privacy.childrenPrivacy.noticeLinkText()),
						".",
					]),
				]
			: []),
	]);
}

function buildDataCollected(config: PrivacyPolicyConfig, t: T): DocumentSection {
	const { collected, context } = config.data;
	const includeLegalBasis =
		config.jurisdictions.includes("eea") || config.jurisdictions.includes("uk");
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
			const label = t.shared.legalBasisLabels[entry.lawfulBasis]();
			cells.push(cell([label]));
		}
		return row(cells);
	});
	const headerLabels = includeLegalBasis
		? t.privacy.dataCollected.headers.withGdpr()
		: t.privacy.dataCollected.headers.withoutGdpr();
	const intro = includeLegalBasis
		? t.privacy.dataCollected.intro.withGdpr()
		: t.privacy.dataCollected.intro.withoutGdpr();
	const reason: ComplianceReason = includeLegalBasis
		? {
				code: "data-collected",
				jurisdiction: ["eea", "uk"],
				citation: "Required by GDPR Article 13(1)(c) and Article 6",
			}
		: {
				code: "data-collected",
				jurisdiction: "eea",
				citation: "Required by GDPR Article 13(1)(c)",
			};
	return section("data-collected", [
		heading(t.privacy.dataCollected.heading(), { reason }),
		p([intro]),
		table(headerLabels, rows),
	]);
}

function usesConsent(config: PrivacyPolicyConfig): boolean {
	if (Object.values(config.data.context).some((e) => e.lawfulBasis === "consent")) return true;
	if (Object.values(config.cookies.context).some((e) => e.lawfulBasis === "consent")) return true;
	return false;
}

function buildConsentWithdrawal(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (!config.jurisdictions.includes("eea") && !config.jurisdictions.includes("uk")) return null;
	if (!usesConsent(config)) return null;
	return section("consent-withdrawal", [
		heading(t.privacy.consentWithdrawal.heading(), {
			reason: {
				code: "consent-withdrawal",
				jurisdiction: ["eea", "uk"],
				lawfulBasis: "consent",
				citation: "Required by GDPR Article 7(3) and Article 13(2)(c)",
			},
		}),
		p([t.privacy.consentWithdrawal.body({ contactEmail: config.company.contact.email })]),
	]);
}

function buildAutomatedDecisionMaking(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (!config.jurisdictions.includes("eea") && !config.jurisdictions.includes("uk")) return null;
	const decisions = config.automatedDecisionMaking;
	if (decisions === undefined) return null;

	const content: ContentNode[] = [
		heading(t.privacy.automatedDecisionMaking.heading(), {
			reason: {
				code: "automated-decision-making",
				jurisdiction: ["eea", "uk"],
				citation: "Required by GDPR and UK-GDPR Article 13(2)(f) and Article 22",
			},
		}),
	];

	if (decisions.length === 0) {
		content.push(p([t.privacy.automatedDecisionMaking.empty()]));
		return section("automated-decision-making", content);
	}

	content.push(p([t.privacy.automatedDecisionMaking.intro()]));
	for (const d of decisions) {
		content.push(
			p([
				bold(d.name),
				" — ",
				d.logic,
				" ",
				bold(t.privacy.automatedDecisionMaking.significanceLabel()),
				" ",
				d.significance,
			]),
		);
	}
	content.push(
		p([
			bold(t.privacy.automatedDecisionMaking.humanReview.label()),
			t.privacy.automatedDecisionMaking.humanReview.body({
				contactEmail: config.company.contact.email,
			}),
		]),
	);
	return section("automated-decision-making", content);
}

function buildDataRetention(config: PrivacyPolicyConfig, t: T): DocumentSection {
	const rows: TableRowNode[] = Object.entries(config.data.context).map(([category, entry]) =>
		row([cell([bold(category)]), cell([entry.retention])]),
	);
	return section("data-retention", [
		heading(t.privacy.dataRetention.heading()),
		p([t.privacy.dataRetention.intro()]),
		table(t.privacy.dataRetention.headers(), rows),
	]);
}

function buildProvisionRequirement(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (!config.jurisdictions.includes("eea") && !config.jurisdictions.includes("uk")) return null;
	const entries = Object.entries(config.data.context);
	if (entries.length === 0) return null;
	const rows: TableRowNode[] = entries.map(([category, entry]) => {
		const requirement = entry.provision;
		const label = t.privacy.provisionBasisLabels[requirement.basis]();
		return row([cell([bold(category)]), cell([label]), cell([requirement.consequences])]);
	});
	return section("provision-requirement", [
		heading(t.privacy.provisionRequirement.heading(), {
			reason: {
				code: "provision-requirement",
				jurisdiction: ["eea", "uk"],
				citation: "Required by GDPR and UK-GDPR Article 13(2)(e)",
			},
		}),
		p([t.privacy.provisionRequirement.body()]),
		table(t.privacy.provisionRequirement.headers(), rows),
	]);
}

function cookieCategoryLabel(key: string, t: T): string {
	const known = t.privacy.cookieCategoryLabels as Record<string, (() => string) | undefined>;
	const entry = known[key];
	return entry ? entry() : t.privacy.cookieCategoryFallback({ key });
}

function buildCookies(config: PrivacyPolicyConfig, t: T): DocumentSection {
	const rows: TableRowNode[] = [];
	for (const [key, enabled] of Object.entries(config.cookies.used)) {
		if (!enabled) continue;
		const label = cookieCategoryLabel(key, t);
		const basis = config.cookies.context[key]?.lawfulBasis;
		rows.push(row([cell([label]), cell([basis ? t.shared.legalBasisLabels[basis]() : ""])]));
	}

	if (rows.length === 0) {
		return section("cookies", [
			heading(t.privacy.cookies.heading()),
			p([t.privacy.cookies.empty()]),
		]);
	}
	return section("cookies", [
		heading(t.privacy.cookies.heading()),
		p([t.privacy.cookies.intro()]),
		table(t.privacy.cookies.headers(), rows),
	]);
}

function buildThirdParties(config: PrivacyPolicyConfig, t: T): DocumentSection {
	if (config.thirdParties.length === 0) {
		return section("third-parties", [
			heading(t.privacy.thirdParties.heading()),
			p([t.privacy.thirdParties.empty()]),
		]);
	}
	const rows: TableRowNode[] = config.thirdParties.map((tp) =>
		row([
			cell([bold(tp.name)]),
			cell([tp.purpose]),
			cell(tp.policyUrl ? [link(tp.policyUrl, t.privacy.thirdParties.linkText())] : [""]),
		]),
	);
	return section("third-parties", [
		heading(t.privacy.thirdParties.heading()),
		p([t.privacy.thirdParties.intro()]),
		table(t.privacy.thirdParties.headers(), rows),
	]);
}

function buildUserRights(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (config.userRights.length === 0) return null;
	const items = config.userRights.map((right) => li([t.privacy.userRights.labels[right]()]));
	return section("user-rights", [
		heading(t.privacy.userRights.heading()),
		p([t.privacy.userRights.intro()]),
		ul(items),
	]);
}

function dpoParagraph(config: PrivacyPolicyConfig, t: T): ContentNode {
	const { dpo } = config.company;
	if (dpo && "email" in dpo) {
		const parts: (string | InlineNode)[] = [bold(t.shared.contactLabels.dpo()), " "];
		if (dpo.name) parts.push(dpo.name, ", ");
		parts.push(dpo.email);
		if (dpo.phone) parts.push(", ", dpo.phone);
		if (dpo.address) parts.push(", ", dpo.address);
		parts.push(t.privacy.dpo.present.trailing());
		return p(parts);
	}
	if (dpo && "required" in dpo && dpo.required === false) {
		const reason = dpo.reason ? ` ${dpo.reason}` : "";
		return p([t.privacy.dpo.absentRequiredFalse({ reason })]);
	}
	return p([t.privacy.dpo.absentFallback()]);
}

function euRepresentativeParagraph(config: PrivacyPolicyConfig, t: T): ContentNode | null {
	const rep = config.company.euRepresentative;
	if (!rep) return null;
	const { prefix, suffix } = t.privacy.euRepresentative.body({
		name: rep.name,
		address: rep.address,
		email: rep.email,
	});
	return p([prefix, bold(rep.name), suffix]);
}

function buildGdprSupplement(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (!config.jurisdictions.includes("eea")) return null;
	const content: ContentNode[] = [
		heading(t.privacy.gdprSupplement.heading(), {
			reason: {
				code: "gdpr-supplement",
				jurisdiction: "eea",
				citation: "Required by GDPR Article 13",
			},
		}),
		p([t.privacy.gdprSupplement.scope()]),
		p([
			t.privacy.gdprSupplement.dataControllerLabel(),
			bold(config.company.legalName),
			`, ${config.company.address}`,
		]),
		dpoParagraph(config, t),
		p([
			t.privacy.gdprSupplement.complaintBody.prefix(),
			link(
				"https://edpb.europa.eu/about-edpb/about-edpb/members_en",
				t.privacy.gdprSupplement.complaintBody.linkText(),
			),
			t.privacy.gdprSupplement.complaintBody.suffix(),
		]),
		p([
			t.privacy.gdprSupplement.transferBody.prefix(),
			link(
				"https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en",
				t.privacy.gdprSupplement.transferBody.adequacyLinkText(),
			),
			t.privacy.gdprSupplement.transferBody.middle(),
			t.privacy.gdprSupplement.transferBody.email({
				contactEmail: config.company.contact.email,
			}),
		]),
	];
	const rep = euRepresentativeParagraph(config, t);
	if (rep) content.push(rep);
	return section("gdpr-supplement", content);
}

function buildUkGdprSupplement(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (!config.jurisdictions.includes("uk")) return null;
	return section("uk-gdpr-supplement", [
		heading(t.privacy.ukGdprSupplement.heading(), {
			reason: {
				code: "uk-gdpr-supplement",
				jurisdiction: "uk",
				citation: "Required by the UK-GDPR and Data Protection Act 2018",
			},
		}),
		p([t.privacy.ukGdprSupplement.scope()]),
		p([
			t.privacy.ukGdprSupplement.dataControllerLabel(),
			bold(config.company.legalName),
			`, ${config.company.address}`,
		]),
		dpoParagraph(config, t),
		p([
			t.privacy.ukGdprSupplement.ico.prefix(),
			bold(t.privacy.ukGdprSupplement.ico.label()),
			t.privacy.ukGdprSupplement.ico.suffix(),
			link("https://ico.org.uk/make-a-complaint/", t.privacy.ukGdprSupplement.ico.linkText()),
			t.privacy.ukGdprSupplement.ico.suffix2(),
		]),
		p([t.privacy.ukGdprSupplement.transferBody()]),
	]);
}

function buildCcpaSupplement(config: PrivacyPolicyConfig, t: T): DocumentSection | null {
	if (!config.jurisdictions.includes("us-ca")) return null;
	const { email, phone } = config.company.contact;
	const submissionMethods: ListItemNode[] = [
		li([bold(t.shared.contactLabels.email()), " ", email]),
	];
	if (phone) submissionMethods.push(li([bold(t.shared.contactLabels.phone()), " ", phone]));
	return section("ccpa-supplement", [
		heading(t.privacy.ccpaSupplement.heading(), {
			reason: {
				code: "ccpa-supplement",
				jurisdiction: "us-ca",
				citation: "Required by CCPA",
			},
		}),
		p([t.privacy.ccpaSupplement.intro()]),
		ul([
			li([t.privacy.ccpaSupplement.rights.know()]),
			li([t.privacy.ccpaSupplement.rights.delete()]),
			li([t.privacy.ccpaSupplement.rights.optOut()]),
			li([t.privacy.ccpaSupplement.rights.nonDiscrimination()]),
		]),
		p([
			bold(t.privacy.ccpaSupplement.submitting.label()),
			t.privacy.ccpaSupplement.submitting.body(),
		]),
		ul(submissionMethods),
	]);
}

function buildContact(config: PrivacyPolicyConfig, t: T): DocumentSection {
	const items = [
		li([bold(t.shared.contactLabels.legalName()), " ", config.company.legalName]),
		li([bold(t.shared.contactLabels.address()), " ", config.company.address]),
		li([bold(t.shared.contactLabels.email()), " ", config.company.contact.email]),
	];
	if (config.company.url) {
		items.push(li([bold(t.shared.contactLabels.url()), " ", config.company.url]));
	}
	if (config.company.contact.phone) {
		items.push(li([bold(t.shared.contactLabels.phone()), " ", config.company.contact.phone]));
	}
	const { dpo } = config.company;
	if (dpo && "email" in dpo) {
		const dpoParts: (string | InlineNode)[] = [bold(t.shared.contactLabels.dpo()), " "];
		if (dpo.name) dpoParts.push(dpo.name, ", ");
		dpoParts.push(dpo.email);
		if (dpo.phone) dpoParts.push(", ", dpo.phone);
		if (dpo.address) dpoParts.push(", ", dpo.address);
		items.push(li(dpoParts));
	}
	return section("contact", [
		heading(t.privacy.contact.heading()),
		p([t.privacy.contact.intro()]),
		ul(items),
	]);
}

const SECTION_BUILDERS: ((config: PrivacyPolicyConfig, t: T) => DocumentSection | null)[] = [
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

export function compilePrivacyDocument(config: PrivacyPolicyConfig, t: T): DocumentSection[] {
	if (Object.keys(config.data.collected).length === 0) {
		throw new Error(
			"OpenPolicy: cannot compile a privacy policy with no data collected. " +
				"Populate `data.collected` in your config, or instrument `collecting()` calls and use the `openPolicy()` Vite plugin.",
		);
	}
	return SECTION_BUILDERS.map((builder) => builder(config, t)).filter(
		(s): s is DocumentSection => s !== null,
	);
}
