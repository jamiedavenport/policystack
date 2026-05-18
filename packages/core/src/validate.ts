import { isLocale, LOCALES } from "./i18n";
import { shouldEmit } from "./index";
import { JURISDICTION_IDS, JURISDICTION_TABLE, resolveJurisdiction } from "./jurisdiction-id";
import { deriveConsentMechanism } from "./normalize";
import type { Issue, PolicyStackConfig } from "./types";
import { isConsentGated } from "./types";

/**
 * The single validator over the flat, public {@link PolicyStackConfig} — the
 * shape users write via `defineConfig()` and the shape PolicyStack Cloud (§9)
 * receives. `consentMechanism` is {@link deriveConsentMechanism | derived}
 * from the cookie posture at entry so the consent checks always see the
 * effective value, never an author's hand-written one. Seeding (`company.*`
 * from package.json) is deliberately NOT applied here — it is a defineConfig
 * concern; keeping validate() free of filesystem reads keeps it pure and
 * deterministic, and in the real pipeline validate() runs on the
 * already-seeded defineConfig output. Privacy and cookie checks are gated by
 * {@link shouldEmit} so a policy is only validated when it will actually be
 * emitted; nothing here depends on the expanded `PolicyInput` shape, so there
 * is no `EMPTY_*`-default false-positive class and no need to dedupe.
 */
export function validate(rawConfig: PolicyStackConfig): Issue[] {
	const config: PolicyStackConfig = {
		...rawConfig,
		consentMechanism: deriveConsentMechanism(rawConfig),
	};
	const issues: Issue[] = [];

	// Required fields
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
			const resolved = resolveJurisdiction(code);
			if (resolved === null) {
				issues.push({
					code: "jurisdiction-unknown",
					level: "error",
					message: `Unknown jurisdiction "${code}" — valid codes: ${JURISDICTION_IDS.join(", ")}`,
				});
			} else if (JURISDICTION_TABLE[resolved].policyText === "equivalent") {
				const via = resolved === code ? "" : ` (resolved to "${resolved}")`;
				issues.push({
					code: "jurisdiction-generic-policy-text",
					level: "warning",
					message: `Jurisdiction "${code}"${via} ships generic policy text only — it is supported at the "equivalent" tier (posture-correct + parent text), not the hand-authored "specific" tier.`,
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
			if (category === "cookie" && !config.cookies) {
				issues.push({
					code: "policy-cookie-empty",
					level: "error",
					message: 'policies includes "cookie" but cookies is not set',
				});
			}
		}
	}

	const gdprScope = config.jurisdictions?.includes("eea") || config.jurisdictions?.includes("uk");

	if (wantPrivacy) {
		if (!config.data) {
			issues.push({
				code: "data-missing",
				level: "error",
				message:
					"data is required — provide a data posture (use an empty data.collected for a site that collects nothing).",
			});
		} else {
			const { collected, context } = config.data;
			const collectedKeys = Object.keys(collected);

			if (collectedKeys.length === 0) {
				issues.push({
					code: "data-collected-empty",
					level: "warning",
					message:
						"data.collected has no entries — the privacy policy will state that no personal data is collected. Add entries if that is not accurate.",
				});
			}

			for (const category of collectedKeys) {
				const entry = context[category];
				if (entry === undefined) {
					issues.push({
						code: "data-context-missing",
						level: "error",
						message: `data.context["${category}"] is missing — every collected category requires a context entry (purpose, lawful basis, retention, provision).`,
					});
					continue;
				}
				if (entry.purpose === undefined) {
					issues.push({
						code: "data-purpose-missing",
						level: "error",
						message: `data.context["${category}"].purpose is missing — every collected category requires a processing purpose (GDPR Art. 13(1)(c))`,
					});
				} else if (entry.purpose.trim().length === 0) {
					issues.push({
						code: "data-purpose-empty",
						level: "error",
						message: `data.context["${category}"].purpose must be a non-empty string`,
					});
				}
			}

			for (const category of Object.keys(context)) {
				if (!(category in collected)) {
					issues.push({
						code: "data-context-orphan",
						level: "error",
						message: `data.context["${category}"] has no matching entry in data.collected — remove it or declare the collected fields`,
					});
				}
			}

			if (gdprScope) {
				for (const category of collectedKeys) {
					if (!context[category]?.lawfulBasis) {
						issues.push({
							code: "lawful-basis-incomplete",
							level: "error",
							message: `data.context["${category}"].lawfulBasis is missing — every collected category requires an Article 6 lawful basis (GDPR Art. 13(1)(c)).`,
						});
					}
					const pr = context[category]?.provision;
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
				const period = context[category]?.retention;
				if (period === undefined || period.trim().length === 0) {
					issues.push({
						code: "retention-incomplete",
						level: "error",
						message: `data.context["${category}"].retention is missing — declare a retention period for every collected category.`,
					});
				}
			}

			if (gdprScope && config.automatedDecisionMaking === undefined) {
				issues.push({
					code: "automated-decision-making",
					level: "warning",
					message:
						"GDPR Article 13(2)(f) requires disclosure of whether automated decision-making (including profiling under Article 22) is used. Set `automatedDecisionMaking: []` to declare none, or list each activity with its logic and significance.",
				});
			}

			if (config.children && config.children.underAge <= 0) {
				issues.push({
					code: "children-under-age-invalid",
					level: "error",
					message: "children.underAge must be a positive number",
				});
			}
		}

		if (gdprScope && config.company?.dpo === undefined) {
			issues.push({
				code: "company-dpo-undeclared",
				level: "warning",
				message:
					"company.dpo is not set — GDPR Article 13(1)(b) requires Data Protection Officer contact details if one is appointed. Set company.dpo, or set company.dpo = { required: false } to declare that none is needed.",
			});
		}

		if (config.jurisdictions?.includes("us-ca") && !config.company?.contact?.phone) {
			issues.push({
				code: "company-contact-phone-recommended",
				level: "warning",
				message:
					"company.contact.phone is not set — CCPA §1798.130(a)(1) requires businesses to provide two or more designated methods for consumers to submit requests, and (unless you operate exclusively online) one must be a toll-free phone number.",
			});
		}
	}

	if (wantCookie && config.cookies) {
		const used = config.cookies.used ?? {};
		const enabledKeys = Object.entries(used)
			.filter(([, enabled]) => enabled)
			.map(([key]) => key);

		if (enabledKeys.length === 0) {
			issues.push({
				code: "cookies-empty",
				level: "error",
				message:
					"At least one cookie type must be enabled (essential, analytics, functional, or marketing)",
			});
		}

		for (const key of enabledKeys) {
			if (!config.cookies.context?.[key]?.lawfulBasis) {
				issues.push({
					code: "cookie-lawful-basis-missing",
					level: "error",
					message: `cookies.context["${key}"].lawfulBasis is missing — every enabled cookie category requires an Article 6 lawful basis.`,
				});
			}
		}

		// `consentMechanism` is DERIVED (normalize-at-entry), never authored.
		// Inside this `wantCookie && config.cookies` block, an absent mechanism
		// means deriveConsentMechanism() found no enabled consent-gated
		// category — an honest "strictly-necessary cookies only" signal, not
		// "you forgot to write it". The `consent-withdrawal-required` branch
		// can no longer fire (a present mechanism is all-true, so canWithdraw
		// is true) but its `code:` literal is retained so the frozen
		// registry⟺validate bidirectional scan (issue-codes.test.ts) stays
		// green and it remains a net for raw-core callers.
		if (!config.consentMechanism) {
			issues.push({
				code: "consent-mechanism-undeclared",
				level: "warning",
				message:
					'No enabled cookie category is consent-gated, so no consent mechanism (banner/preference panel/withdrawal) is generated — correct for strictly-necessary cookies only. Set a category\'s lawfulBasis to "consent" if it requires opt-in.',
			});
		} else if (gdprScope && !config.consentMechanism.canWithdraw) {
			issues.push({
				code: "consent-withdrawal-required",
				level: "warning",
				message:
					"GDPR and UK-GDPR require that users can withdraw cookie consent — consider setting consentMechanism.canWithdraw to true",
			});
		}

		// Provably-unreachable from a normalized config (a derived mechanism is
		// all-true, so `hasBanner` is never false and `hasPreferencePanel ===
		// false && canWithdraw === true` can never hold), but retained
		// verbatim: the `code:` literals keep the 4 consent codes reachable for
		// the bidirectional registry scan, and this stays a dead-safe net for
		// raw-core callers that construct a hand-written mechanism directly.
		if (config.consentMechanism) {
			const hasGatedCategory = enabledKeys.some((key) =>
				isConsentGated(config.cookies?.context?.[key]?.lawfulBasis),
			);
			if (config.consentMechanism.hasBanner === false && hasGatedCategory) {
				issues.push({
					code: "consent-banner-required",
					level: "warning",
					message:
						"consentMechanism.hasBanner is false but at least one cookie category is consent-gated — a banner is needed to collect affirmative consent for the wired runtime.",
				});
			}
			if (
				config.consentMechanism.hasPreferencePanel === false &&
				config.consentMechanism.canWithdraw === true
			) {
				issues.push({
					code: "consent-preference-panel-required",
					level: "warning",
					message:
						"consentMechanism.canWithdraw is true but hasPreferencePanel is false — withdrawal/management has no preference panel in the wired runtime.",
				});
			}
		}
	}

	return issues;
}
