import type { CookiePolicyConfig } from "../types";
import { bold, cell, heading, li, link, p, row, section, table, ul } from "./helpers";
import type { DocumentSection, TableRowNode } from "./types";

function buildIntroduction(config: CookiePolicyConfig): DocumentSection {
	const versionSuffix = config.version ? ` Version: ${config.version}.` : "";
	return section("cookie-introduction", [
		heading("Cookie Policy"),
		p([
			`This Cookie Policy explains how ${config.company.name} ("we", "us", or "our") uses cookies and similar tracking technologies on our services. Effective Date: ${config.effectiveDate}.${versionSuffix}`,
		]),
	]);
}

function buildWhatAreCookies(): DocumentSection {
	return section("cookie-what-are-cookies", [
		heading("What Are Cookies?"),
		p([
			"Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work more efficiently and to provide information to site owners.",
		]),
		p([
			'Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (remain on your device until they expire or you delete them).',
		]),
	]);
}

const COOKIE_TYPE_LABELS: Record<string, { label: string; description: string }> = {
	essential: {
		label: "Essential Cookies",
		description: "Required for the basic functioning of our services. These cannot be disabled.",
	},
	analytics: {
		label: "Analytics Cookies",
		description:
			"Help us understand how visitors interact with our services so we can improve them.",
	},
	functional: {
		label: "Functional Cookies",
		description:
			"Enable enhanced functionality and personalisation, such as remembering your preferences.",
	},
	marketing: {
		label: "Marketing Cookies",
		description: "Used to deliver advertisements more relevant to you and your interests.",
	},
};

function buildTypes(config: CookiePolicyConfig): DocumentSection {
	const types: { label: string; description: string }[] = [];
	for (const [key, enabled] of Object.entries(config.cookies.used)) {
		if (!enabled) continue;
		const meta = COOKIE_TYPE_LABELS[key] ?? {
			label: `${key.charAt(0).toUpperCase()}${key.slice(1)} Cookies`,
			description: "",
		};
		types.push(meta);
	}

	if (types.length === 0) {
		return section("cookie-types", [
			heading("Types of Cookies We Use"),
			p(["We do not currently use any cookies."]),
		]);
	}

	const rows: TableRowNode[] = types.map((t) =>
		row([cell([bold(t.label)]), cell([t.description])]),
	);
	return section("cookie-types", [
		heading("Types of Cookies We Use"),
		table(["Type", "Description"], rows),
	]);
}

function buildTrackingTechnologies(config: CookiePolicyConfig): DocumentSection | null {
	if (!config.trackingTechnologies || config.trackingTechnologies.length === 0) return null;
	return section("cookie-tracking-technologies", [
		heading("Other Tracking Technologies"),
		p(["In addition to cookies, we may use the following tracking technologies:"]),
		ul(config.trackingTechnologies.map((t) => li([t]))),
	]);
}

function buildThirdParties(config: CookiePolicyConfig): DocumentSection | null {
	if (!config.thirdParties || config.thirdParties.length === 0) return null;
	const rows: TableRowNode[] = config.thirdParties.map((t) =>
		row([
			cell([bold(t.name)]),
			cell([t.purpose]),
			cell(t.policyUrl ? [link(t.policyUrl, "View")] : [""]),
		]),
	);
	return section("cookie-third-parties", [
		heading("Third-Party Cookies"),
		p(["The following third parties may set cookies through our services:"]),
		table(["Service", "Purpose", "Privacy policy"], rows),
	]);
}

function buildConsent(config: CookiePolicyConfig): DocumentSection | null {
	if (!config.consentMechanism) return null;
	const { hasBanner, hasPreferencePanel, canWithdraw } = config.consentMechanism;
	const items: string[] = [];
	if (hasBanner)
		items.push("We display a cookie consent banner when you first visit our services.");
	if (hasPreferencePanel)
		items.push("You can manage your cookie preferences at any time via our preference panel.");
	if (canWithdraw)
		items.push(
			"You may withdraw your consent at any time; however, this will not affect the lawfulness of processing based on consent before its withdrawal.",
		);
	if (items.length === 0) return null;
	return section("cookie-consent", [heading("Your Consent"), ul(items.map((i) => li([i])))]);
}

function buildManaging(): DocumentSection {
	return section("cookie-managing", [
		heading("Managing Cookies"),
		p(["Most web browsers allow you to control cookies through their settings. You can:"]),
		ul([
			li(["Delete cookies already stored on your device"]),
			li(["Block cookies from being set on your device"]),
			li(["Set your browser to notify you when a cookie is being set"]),
		]),
		p([
			"Please note that restricting cookies may impact the functionality of our services. Consult your browser's help documentation for instructions on managing cookies.",
		]),
	]);
}

function buildJurisdictionEuUk(config: CookiePolicyConfig): DocumentSection | null {
	const hasEu = config.jurisdictions.includes("eu");
	const hasUk = config.jurisdictions.includes("uk");
	if (!hasEu && !hasUk) return null;
	const regions =
		hasEu && hasUk
			? "European Economic Area or the United Kingdom"
			: hasEu
				? "European Economic Area"
				: "United Kingdom";
	const heading_text =
		hasEu && hasUk
			? "European and UK Users (GDPR / UK-GDPR)"
			: hasEu
				? "European Users (GDPR)"
				: "UK Users (UK-GDPR)";
	const reason = hasUk
		? "Required under the UK-GDPR and PECR"
		: "Required under ePrivacy Directive and GDPR";
	return section("cookie-jurisdiction-eu-uk", [
		heading(heading_text, { reason }),
		p([
			`If you are located in the ${regions}, we rely on your consent as our legal basis for setting non-essential cookies. You have the right to withdraw consent at any time.`,
		]),
		p([
			"Essential cookies are set on the basis of our legitimate interests to provide you with a functioning service.",
		]),
	]);
}

function buildContact(config: CookiePolicyConfig): DocumentSection {
	const items = [
		li([bold("Legal Name: "), config.company.legalName]),
		li([bold("Address: "), config.company.address]),
		li([bold("Email: "), config.company.contact.email]),
	];
	if (config.company.contact.phone) {
		items.push(li([bold("Phone: "), config.company.contact.phone]));
	}
	return section("cookie-contact", [
		heading("Contact Us"),
		p(["If you have questions about this Cookie Policy, please contact us:"]),
		ul(items),
	]);
}

const SECTION_BUILDERS: ((config: CookiePolicyConfig) => DocumentSection | null)[] = [
	buildIntroduction,
	() => buildWhatAreCookies(),
	buildTypes,
	buildTrackingTechnologies,
	buildThirdParties,
	buildConsent,
	() => buildManaging(),
	buildJurisdictionEuUk,
	buildContact,
];

export function compileCookieDocument(config: CookiePolicyConfig): DocumentSection[] {
	return SECTION_BUILDERS.map((builder) => builder(config)).filter(
		(s): s is DocumentSection => s !== null,
	);
}
