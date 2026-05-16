import type { T } from "../i18n";
import { formatDate } from "../i18n";
import type { CookiePolicyConfig } from "../types";
import { bold, cell, heading, li, link, p, row, section, table, ul } from "./helpers";
import type { ComplianceReason, DocumentSection, TableRowNode } from "./types";

function versionSuffix(config: CookiePolicyConfig, t: T): string {
	return config.version ? t.shared.versionSuffix({ version: config.version }) : "";
}

function buildIntroduction(config: CookiePolicyConfig, t: T): DocumentSection {
	return section("cookie-introduction", [
		heading(t.cookie.introduction.heading()),
		p([
			t.cookie.introduction.body({
				companyName: config.company.name,
				effectiveDate: formatDate(config.effectiveDate, config.locale),
				versionSuffix: versionSuffix(config, t),
			}),
		]),
	]);
}

function buildWhatAreCookies(t: T): DocumentSection {
	return section("cookie-what-are-cookies", [
		heading(t.cookie.whatAreCookies.heading()),
		p([t.cookie.whatAreCookies.body1()]),
		p([t.cookie.whatAreCookies.body2()]),
	]);
}

function cookieTypeMeta(key: string, t: T): { label: string; description: string } {
	const known = t.cookie.types.labels as Record<
		string,
		{ label: () => string; description: () => string } | undefined
	>;
	const entry = known[key];
	if (entry) return { label: entry.label(), description: entry.description() };
	return t.cookie.types.fallback({ key });
}

function buildTypes(config: CookiePolicyConfig, t: T): DocumentSection {
	const types: { label: string; description: string }[] = [];
	for (const [key, enabled] of Object.entries(config.cookies.used)) {
		if (!enabled) continue;
		types.push(cookieTypeMeta(key, t));
	}

	if (types.length === 0) {
		return section("cookie-types", [
			heading(t.cookie.types.heading()),
			p([t.cookie.types.empty()]),
		]);
	}

	const rows: TableRowNode[] = types.map((entry) =>
		row([cell([bold(entry.label)]), cell([entry.description])]),
	);
	return section("cookie-types", [
		heading(t.cookie.types.heading()),
		table(t.cookie.types.headers(), rows),
	]);
}

function buildTrackingTechnologies(config: CookiePolicyConfig, t: T): DocumentSection | null {
	if (!config.trackingTechnologies || config.trackingTechnologies.length === 0) return null;
	return section("cookie-tracking-technologies", [
		heading(t.cookie.trackingTechnologies.heading()),
		p([t.cookie.trackingTechnologies.intro()]),
		ul(config.trackingTechnologies.map((tt) => li([tt]))),
	]);
}

function buildThirdParties(config: CookiePolicyConfig, t: T): DocumentSection | null {
	if (!config.thirdParties || config.thirdParties.length === 0) return null;
	const rows: TableRowNode[] = config.thirdParties.map((tp) =>
		row([
			cell([bold(tp.name)]),
			cell([tp.purpose]),
			cell(tp.policyUrl ? [link(tp.policyUrl, t.cookie.thirdParties.linkText())] : [""]),
		]),
	);
	return section("cookie-third-parties", [
		heading(t.cookie.thirdParties.heading()),
		p([t.cookie.thirdParties.intro()]),
		table(t.cookie.thirdParties.headers(), rows),
	]);
}

function buildConsent(config: CookiePolicyConfig, t: T): DocumentSection | null {
	if (!config.consentMechanism) return null;
	const { hasBanner, hasPreferencePanel, canWithdraw } = config.consentMechanism;
	const items: string[] = [];
	if (hasBanner) items.push(t.cookie.consent.banner());
	if (hasPreferencePanel) items.push(t.cookie.consent.panel());
	if (canWithdraw) items.push(t.cookie.consent.withdraw());
	if (items.length === 0) return null;
	return section("cookie-consent", [
		heading(t.cookie.consent.heading()),
		ul(items.map((i) => li([i]))),
	]);
}

function buildManaging(t: T): DocumentSection {
	return section("cookie-managing", [
		heading(t.cookie.managing.heading()),
		p([t.cookie.managing.intro()]),
		ul([
			li([t.cookie.managing.items.delete()]),
			li([t.cookie.managing.items.block()]),
			li([t.cookie.managing.items.notify()]),
		]),
		p([t.cookie.managing.footer()]),
	]);
}

function buildJurisdictionEuUk(config: CookiePolicyConfig, t: T): DocumentSection | null {
	const hasEu = config.jurisdictions.includes("eu");
	const hasUk = config.jurisdictions.includes("uk");
	if (!hasEu && !hasUk) return null;
	const branch: "euAndUk" | "eu" | "uk" = hasEu && hasUk ? "euAndUk" : hasEu ? "eu" : "uk";
	const reason: ComplianceReason = hasUk
		? {
				code: "cookie-jurisdiction-eu-uk",
				jurisdiction: "uk",
				citation: "Required under the UK-GDPR and PECR",
			}
		: {
				code: "cookie-jurisdiction-eu-uk",
				jurisdiction: "eea",
				citation: "Required under ePrivacy Directive and GDPR",
			};
	return section("cookie-jurisdiction-eu-uk", [
		heading(t.cookie.jurisdictionEuUk.heading[branch](), { reason }),
		p([t.cookie.jurisdictionEuUk.body({ region: t.cookie.jurisdictionEuUk.region[branch]() })]),
		p([t.cookie.jurisdictionEuUk.essentialBody()]),
	]);
}

function buildContact(config: CookiePolicyConfig, t: T): DocumentSection {
	const items = [
		li([bold(`${t.shared.contactLabels.legalName()} `), config.company.legalName]),
		li([bold(`${t.shared.contactLabels.address()} `), config.company.address]),
		li([bold(`${t.shared.contactLabels.email()} `), config.company.contact.email]),
	];
	if (config.company.contact.phone) {
		items.push(li([bold(`${t.shared.contactLabels.phone()} `), config.company.contact.phone]));
	}
	return section("cookie-contact", [
		heading(t.cookie.contact.heading()),
		p([t.cookie.contact.intro()]),
		ul(items),
	]);
}

const SECTION_BUILDERS: ((config: CookiePolicyConfig, t: T) => DocumentSection | null)[] = [
	buildIntroduction,
	(_, t) => buildWhatAreCookies(t),
	buildTypes,
	buildTrackingTechnologies,
	buildThirdParties,
	buildConsent,
	(_, t) => buildManaging(t),
	buildJurisdictionEuUk,
	buildContact,
];

export function compileCookieDocument(config: CookiePolicyConfig, t: T): DocumentSection[] {
	return SECTION_BUILDERS.map((builder) => builder(config, t)).filter(
		(s): s is DocumentSection => s !== null,
	);
}
