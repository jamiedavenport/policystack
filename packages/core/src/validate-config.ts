import { isLocale, LOCALES } from "./i18n";
import { shouldEmit } from "./index";
import { isJurisdiction, JURISDICTIONS } from "./jurisdictions";
import type { OpenPolicyConfig, PolicyCategory, ValidationIssue } from "./types";

export function validateOpenPolicyConfig(config: OpenPolicyConfig): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	if (!config.effectiveDate)
		issues.push({
			code: "effective-date-required",
			level: "error",
			message: "effectiveDate is required",
		});
	if (!config.company?.name)
		issues.push({
			code: "company-name-required",
			level: "error",
			message: "company.name is required",
		});
	if (!config.company?.legalName)
		issues.push({
			code: "company-legal-name-required",
			level: "error",
			message: "company.legalName is required",
		});
	if (!config.company?.address)
		issues.push({
			code: "company-address-required",
			level: "error",
			message: "company.address is required",
		});
	if (!config.company?.contact?.email)
		issues.push({
			code: "company-contact-required",
			level: "error",
			message: "company.contact.email is required",
		});
	if (!config.jurisdictions || config.jurisdictions.length === 0) {
		issues.push({
			code: "jurisdictions-required",
			level: "error",
			message: "jurisdictions must have at least one entry",
		});
	} else {
		for (const code of config.jurisdictions) {
			if (!isJurisdiction(code)) {
				issues.push({
					code: "jurisdiction-unknown",
					level: "error",
					message: `Unknown jurisdiction "${code}" — valid codes: ${JURISDICTIONS.join(", ")}`,
				});
			}
		}
	}

	if (config.locale !== undefined && !isLocale(config.locale)) {
		issues.push({
			code: "locale-unknown",
			level: "error",
			message: `Unknown locale "${config.locale}" — valid codes: ${LOCALES.join(", ")}`,
		});
	}

	const wantPrivacy = shouldEmit("privacy", config);
	const wantCookie = shouldEmit("cookie", config);

	if (!wantPrivacy && !wantCookie) {
		issues.push({
			code: "policy-empty",
			level: "error",
			message:
				"Config must produce at least one policy — provide data-handling fields (data, children) or cookies",
		});
	}

	if (config.policies) {
		for (const category of config.policies) {
			if (category === "privacy" && !hasAnyPrivacyField(config)) {
				issues.push({
					code: "policy-privacy-empty",
					level: "error",
					message:
						'policies includes "privacy" but no data-handling fields are set — add data or children',
				});
			}
			if (category === "cookie" && !config.cookies) {
				issues.push({
					code: "policy-cookie-empty",
					level: "error",
					message: 'policies includes "cookie" but cookies is not set',
				});
			}
		}
	}

	if (wantPrivacy && !config.data) {
		issues.push({
			code: "data-missing",
			level: "warning",
			message: "data is not set — the privacy policy will render a placeholder section",
		});
	}

	if (wantPrivacy && config.data) {
		const collectedKeys = Object.keys(config.data.collected);
		const gdprScope = config.jurisdictions?.includes("eu") || config.jurisdictions?.includes("uk");
		if (gdprScope) {
			for (const category of collectedKeys) {
				if (!config.data.context?.[category]?.lawfulBasis) {
					issues.push({
						code: "lawful-basis-incomplete",
						level: "error",
						message: `data.context["${category}"].lawfulBasis is missing — every collected category requires an Article 6 lawful basis (GDPR Art. 13(1)(c)).`,
					});
				}
				const pr = config.data.context?.[category]?.provision;
				if (!pr || !pr.basis) {
					issues.push({
						code: "statutory-contractual-obligation",
						level: "error",
						message: `data.context["${category}"].provision is missing — GDPR Art. 13(2)(e) requires disclosure of whether provision is statutory, contractual, a contract-prerequisite, or voluntary, and the consequences of failure to provide it.`,
					});
				} else if (typeof pr.consequences !== "string" || pr.consequences.trim().length === 0) {
					issues.push({
						code: "statutory-contractual-obligation",
						level: "error",
						message: `data.context["${category}"].provision.consequences is empty — GDPR Art. 13(2)(e) requires the consequences of failure to provide this data.`,
					});
				}
			}
		}
		for (const category of collectedKeys) {
			const period = config.data.context?.[category]?.retention;
			if (period === undefined || period.trim().length === 0) {
				issues.push({
					code: "retention-incomplete",
					level: "error",
					message: `data.context["${category}"].retention is missing — declare a retention period for every collected category.`,
				});
			}
		}
	}

	if (config.cookies) {
		const used = config.cookies.used ?? {};
		for (const [key, enabled] of Object.entries(used)) {
			if (!enabled) continue;
			if (!config.cookies.context?.[key]?.lawfulBasis) {
				issues.push({
					code: "cookie-lawful-basis-missing",
					level: "error",
					message: `cookies.context["${key}"].lawfulBasis is missing — every enabled cookie category requires an Article 6 lawful basis.`,
				});
			}
		}
	}

	const gdprScope = config.jurisdictions?.includes("eu") || config.jurisdictions?.includes("uk");
	if (wantPrivacy && gdprScope && config.company?.dpo === undefined) {
		issues.push({
			code: "company-dpo-undeclared",
			level: "warning",
			message:
				"company.dpo is not set — GDPR Article 13(1)(b) requires Data Protection Officer contact details if one is appointed. Set company.dpo, or set company.dpo = { required: false } to declare that none is needed.",
		});
	}

	if (wantPrivacy && config.jurisdictions?.includes("us-ca") && !config.company?.contact?.phone) {
		issues.push({
			code: "company-contact-phone-recommended",
			level: "warning",
			message:
				"company.contact.phone is not set — CCPA §1798.130(a)(1) requires businesses to provide two or more designated methods for consumers to submit requests, and (unless you operate exclusively online) one must be a toll-free phone number.",
		});
	}

	return issues;
}

function hasAnyPrivacyField(config: OpenPolicyConfig): boolean {
	return config.data !== undefined || config.children !== undefined;
}

export type { PolicyCategory };
