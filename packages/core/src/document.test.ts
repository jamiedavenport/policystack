import { expect, test } from "vite-plus/test";
import type { Document, ParagraphNode, TableNode } from "./documents";
import { compilePrivacyPolicy } from "./index";
import type { PolicyStackConfig } from "./types";

// compilePrivacyPolicy returns Document | null (null = privacy not emitted).
// Every fixture below has data.collected populated, so a Document is expected;
// unwrap once here rather than asserting non-null at 40 call sites.
function privacy(config: PolicyStackConfig): Document {
	const doc = compilePrivacyPolicy(config);
	if (!doc) throw new Error("expected a privacy document");
	return doc;
}

const minimalPrivacyConfig: PolicyStackConfig = {
	effectiveDate: "2026-01-01",
	locale: "en",
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	data: {
		collected: { "Account Information": ["Name", "Email address"] },
		context: {
			"Account Information": {
				purpose: "To authenticate users and send service notifications",
				lawfulBasis: "contract",
				retention: "Until account deletion",
				provision: {
					basis: "contract-prerequisite",
					consequences: "We cannot create or operate your account.",
				},
			},
		},
	},
	cookies: {
		used: { essential: true, analytics: false, marketing: false },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
	thirdParties: [],
	jurisdictions: ["ca"],
};

test("compile returns a Document with correct type", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	expect(doc.policyType).toBe("privacy");
	expect(Array.isArray(doc.sections)).toBe(true);
});

test("privacy compile returns non-empty sections", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	expect(doc.sections.length).toBeGreaterThan(0);
});

test("Reserved-region config has expected section IDs (no EU/UK/CA-only sections)", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	const ids = doc.sections.map((s) => s.id);
	expect(ids).toContain("introduction");
	expect(ids).toContain("data-collected");
	expect(ids).toContain("data-retention");
	expect(ids).toContain("cookies");
	expect(ids).toContain("third-parties");
	expect(ids).toContain("contact");
	expect(ids).not.toContain("legal-basis");
	expect(ids).not.toContain("gdpr-supplement");
	expect(ids).not.toContain("uk-gdpr-supplement");
	expect(ids).not.toContain("ccpa-supplement");
	// user-rights is jurisdiction-derived now (deriveUserRights). Canada-only
	// declares no statutory rights, so the section is correctly absent here.
	expect(ids).not.toContain("user-rights");
});

test("user-rights section is derived from jurisdiction (present under EEA, absent for Canada-only)", () => {
	const caOnly = privacy({ ...minimalPrivacyConfig });
	expect(caOnly.sections.map((s) => s.id)).not.toContain("user-rights");

	const eea = privacy({ ...minimalPrivacyConfig, jurisdictions: ["eea"] });
	const ur = eea.sections.find((s) => s.id === "user-rights");
	expect(ur).toBeDefined();
	const blob = JSON.stringify(ur);
	expect(blob).toContain("Your Rights");
	expect(blob).toContain("Right to access your personal data");
});

test("EU config includes lawful-basis column in data-collected and gdpr-supplement", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
	});
	const ids = doc.sections.map((s) => s.id);
	expect(ids).toContain("gdpr-supplement");
	expect(ids).not.toContain("uk-gdpr-supplement");
	const dc = doc.sections.find((s) => s.id === "data-collected")!;
	const tbl = dc.content.find((n) => n.type === "table") as TableNode;
	expect(tbl.header.cells.length).toBe(4);
});

test("UK config includes lawful-basis column in data-collected and uk-gdpr-supplement (not gdpr-supplement)", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["uk"],
	});
	const ids = doc.sections.map((s) => s.id);
	expect(ids).toContain("uk-gdpr-supplement");
	expect(ids).not.toContain("gdpr-supplement");
	const dc = doc.sections.find((s) => s.id === "data-collected")!;
	const tbl = dc.content.find((n) => n.type === "table") as TableNode;
	expect(tbl.header.cells.length).toBe(4);
	const ukSection = doc.sections.find((s) => s.id === "uk-gdpr-supplement")!;
	const textBlob = JSON.stringify(ukSection);
	expect(textBlob).toContain("Information Commissioner");
	expect(textBlob).toContain("Data Protection Act 2018");
});

test("US-CA config includes ccpa-supplement", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["us-ca"],
	});
	const ids = doc.sections.map((s) => s.id);
	expect(ids).toContain("ccpa-supplement");
});

test("CA (Canada) alone does not include ccpa-supplement or gdpr-supplement", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["ca"],
	});
	const ids = doc.sections.map((s) => s.id);
	expect(ids).not.toContain("ccpa-supplement");
	expect(ids).not.toContain("gdpr-supplement");
	expect(ids).not.toContain("uk-gdpr-supplement");
});

test("children-privacy section absent when children not set", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	const ids = doc.sections.map((s) => s.id);
	expect(ids).not.toContain("children-privacy");
});

test("children-privacy section present when children is set", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		children: { underAge: 13 },
	});
	const ids = doc.sections.map((s) => s.id);
	expect(ids).toContain("children-privacy");
});

test("children-privacy has noticeUrl link when provided", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		children: { underAge: 13, noticeUrl: "https://acme.com/children" },
	});
	const section = doc.sections.find((s) => s.id === "children-privacy")!;
	expect(section.content.length).toBe(3); // heading + 2 paragraphs
	const secondPara = section.content[2];
	expect(secondPara?.type).toBe("paragraph");
	const children = (secondPara as ParagraphNode).children;
	const linkNode = children.find((c) => c.type === "link");
	expect(linkNode).toBeDefined();
});

test("compile throws when data.collected is empty", () => {
	expect(() =>
		privacy({
			...minimalPrivacyConfig,
			data: {
				collected: {},
				context: {},
			},
		}),
	).toThrow(/no data collected/i);
});

test("data-collected section has a table with at least one row", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	const s = doc.sections.find((x) => x.id === "data-collected")!;
	const tbl = s.content.find((n) => n.type === "table") as TableNode;
	expect(tbl.rows.length).toBeGreaterThan(0);
	expect(tbl.header.cells.length).toBe(3);
});

test("data-collected table includes the purpose for each category", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		data: {
			collected: {
				"Account Information": ["Name", "Email"],
				"Session Data": ["IP address"],
			},
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: "Until account deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot create or operate your account.",
					},
				},
				"Session Data": {
					purpose: "To secure sessions",
					lawfulBasis: "legitimate_interests",
					retention: "30 days",
					provision: {
						basis: "voluntary",
						consequences: "None — your service is unaffected.",
					},
				},
			},
		},
	});
	const s = doc.sections.find((x) => x.id === "data-collected")!;
	const blob = JSON.stringify(s);
	expect(blob).toContain("To authenticate users");
	expect(blob).toContain("To secure sessions");
	expect(blob).toContain("Purpose");
});

test("gdpr-supplement mentions DPO when one is configured", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		company: {
			...minimalPrivacyConfig.company,
			dpo: { email: "dpo@acme.com", name: "Jane Doe", phone: "+1 555 010 2030" },
		},
	});
	const gdpr = doc.sections.find((s) => s.id === "gdpr-supplement")!;
	const blob = JSON.stringify(gdpr);
	expect(blob).toContain("Data Protection Officer");
	expect(blob).toContain("dpo@acme.com");
	expect(blob).toContain("Jane Doe");
	expect(blob).toContain("+1 555 010 2030");
});

test("gdpr-supplement states no DPO when company.dpo.required === false", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		company: {
			...minimalPrivacyConfig.company,
			dpo: { required: false, reason: "Small-scale processing only." },
		},
	});
	const gdpr = doc.sections.find((s) => s.id === "gdpr-supplement")!;
	const blob = JSON.stringify(gdpr);
	expect(blob).toContain("have not appointed a Data Protection Officer");
	expect(blob).toContain("Article 37(1)");
	expect(blob).toContain("Small-scale processing only.");
});

test("gdpr-supplement falls back to no-DPO disclosure when unset", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
	});
	const gdpr = doc.sections.find((s) => s.id === "gdpr-supplement")!;
	const blob = JSON.stringify(gdpr);
	expect(blob).toContain("Data Protection Officer");
	expect(blob).toContain("Article 37(1)");
});

test("uk-gdpr-supplement includes DPO contact when configured", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["uk"],
		company: {
			...minimalPrivacyConfig.company,
			dpo: { email: "dpo@acme.co.uk" },
		},
	});
	const uk = doc.sections.find((s) => s.id === "uk-gdpr-supplement")!;
	const blob = JSON.stringify(uk);
	expect(blob).toContain("Data Protection Officer");
	expect(blob).toContain("dpo@acme.co.uk");
});

test("contact section lists DPO when configured", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		company: {
			...minimalPrivacyConfig.company,
			dpo: { email: "dpo@acme.com", name: "Jane Doe" },
		},
	});
	const contact = doc.sections.find((s) => s.id === "contact")!;
	const blob = JSON.stringify(contact);
	expect(blob).toContain("Data Protection Officer");
	expect(blob).toContain("dpo@acme.com");
});

test("introduction section has ParagraphNode children", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	const intro = doc.sections.find((s) => s.id === "introduction")!;
	expect(intro.content.length).toBeGreaterThan(0);
	const firstNode = intro.content[0];
	expect(firstNode?.type).toBe("heading");
	const firstPara = intro.content[1] as ParagraphNode;
	expect(firstPara.children.length).toBeGreaterThan(0);
	expect(firstPara.children[0]?.type).toBe("text");
});

test("privacy introduction renders version when set", () => {
	const doc = privacy({ ...minimalPrivacyConfig, privacyVersion: "abc12345" });
	const intro = doc.sections.find((s) => s.id === "introduction")!;
	expect(JSON.stringify(intro)).toContain("Version: abc12345");
});

test("privacy introduction omits version line when version is unset", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	const intro = doc.sections.find((s) => s.id === "introduction")!;
	expect(JSON.stringify(intro)).not.toContain("Version:");
});

test("data-collected table includes lawful-basis labels with Article 6 sub-clause under EU jurisdiction", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		data: {
			collected: {
				"Personal Information": ["Name", "Email"],
				"Marketing Data": ["Mailing list signup"],
			},
			context: {
				"Personal Information": {
					purpose: "Providing the service",
					lawfulBasis: "contract",
					retention: "Until account deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot provide the service.",
					},
				},
				"Marketing Data": {
					purpose: "Marketing communications",
					lawfulBasis: "consent",
					retention: "Until consent is withdrawn",
					provision: {
						basis: "voluntary",
						consequences: "None — your service is unaffected.",
					},
				},
			},
		},
	});
	const dc = doc.sections.find((s) => s.id === "data-collected")!;
	const blob = JSON.stringify(dc);
	expect(blob).toContain("Providing the service");
	expect(blob).toContain("Performance of a contract (Article 6(1)(b))");
	expect(blob).toContain("Marketing communications");
	expect(blob).toContain("Consent (Article 6(1)(a))");
});

test("consent-withdrawal section is rendered when any data category uses consent (EU)", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		data: {
			collected: {
				"Personal Information": ["Name"],
				"Marketing Data": ["Mailing list signup"],
			},
			context: {
				"Personal Information": {
					purpose: "Providing the service",
					lawfulBasis: "contract",
					retention: "Until account deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot provide the service.",
					},
				},
				"Marketing Data": {
					purpose: "Marketing communications",
					lawfulBasis: "consent",
					retention: "Until consent is withdrawn",
					provision: {
						basis: "voluntary",
						consequences: "None — your service is unaffected.",
					},
				},
			},
		},
	});
	const cw = doc.sections.find((s) => s.id === "consent-withdrawal")!;
	expect(cw).toBeDefined();
	const blob = JSON.stringify(cw);
	expect(blob).toContain("Right to Withdraw Consent");
	expect(blob).toContain("Article 7(3)");
	expect(blob).toContain(minimalPrivacyConfig.company.contact.email);
	expect(blob).toContain("does not affect the lawfulness");
});

test("consent-withdrawal section is rendered when only cookies use consent (EU)", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		cookies: {
			used: { essential: true, analytics: true },
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				analytics: { lawfulBasis: "consent" },
			},
		},
	});
	const cw = doc.sections.find((s) => s.id === "consent-withdrawal")!;
	expect(cw).toBeDefined();
	const blob = JSON.stringify(cw);
	expect(blob).toContain("Right to Withdraw Consent");
});

test("consent-withdrawal section is omitted when no data or cookie basis is consent (EU)", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		data: {
			collected: {
				"Personal Information": ["Name"],
				"Service Data": ["Logs"],
			},
			context: {
				"Personal Information": {
					purpose: "Providing the service",
					lawfulBasis: "contract",
					retention: "Until account deletion",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot provide the service.",
					},
				},
				"Service Data": {
					purpose: "Service communications",
					lawfulBasis: "legitimate_interests",
					retention: "30 days",
					provision: {
						basis: "voluntary",
						consequences: "None — your service is unaffected.",
					},
				},
			},
		},
		cookies: {
			used: { essential: true },
			context: { essential: { lawfulBasis: "legal_obligation" } },
		},
	});
	expect(doc.sections.find((s) => s.id === "consent-withdrawal")).toBeUndefined();
});

test("consent-withdrawal section is omitted under non-EU/UK jurisdictions even when consent is used", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["us-ca"],
		cookies: {
			used: { essential: true, analytics: true },
			context: {
				essential: { lawfulBasis: "legal_obligation" },
				analytics: { lawfulBasis: "consent" },
			},
		},
	});
	expect(doc.sections.find((s) => s.id === "consent-withdrawal")).toBeUndefined();
});

test("data-collected section does not carry the consent-withdrawal paragraph (it's its own section now)", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		data: {
			collected: { "Marketing Data": ["Email"] },
			context: {
				"Marketing Data": {
					purpose: "Marketing communications",
					lawfulBasis: "consent",
					retention: "Until consent is withdrawn",
					provision: {
						basis: "voluntary",
						consequences: "None — your service is unaffected.",
					},
				},
			},
		},
	});
	const dc = doc.sections.find((s) => s.id === "data-collected")!;
	const blob = JSON.stringify(dc);
	expect(blob).not.toContain("Right to withdraw consent");
});

test("data-collected table omits the lawful-basis column under non-GDPR jurisdictions", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["ca"],
	});
	const dc = doc.sections.find((s) => s.id === "data-collected")!;
	const tbl = dc.content.find((n) => n.type === "table") as TableNode;
	expect(tbl.header.cells.length).toBe(3);
	expect(JSON.stringify(dc)).not.toContain("Article 6");
});

test("automated-decision-making section is omitted under non-EU/UK jurisdictions even when set", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["us-ca"],
		automatedDecisionMaking: [],
	});
	expect(doc.sections.find((s) => s.id === "automated-decision-making")).toBeUndefined();
});

test("automated-decision-making section is omitted when field is undefined under EU", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
	});
	expect(doc.sections.find((s) => s.id === "automated-decision-making")).toBeUndefined();
});

test("automated-decision-making section emits explicit-none paragraph when [] under EU", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		automatedDecisionMaking: [],
	});
	const adm = doc.sections.find((s) => s.id === "automated-decision-making")!;
	expect(adm).toBeDefined();
	const blob = JSON.stringify(adm);
	expect(blob).toContain("We do not engage in automated decision-making");
	expect(blob).toContain("Article 22");
	expect(blob).not.toContain("Right to human review");
});

test("gdpr-supplement complaint paragraph links to EDPB members directory", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
	});
	const gdpr = doc.sections.find((s) => s.id === "gdpr-supplement")!;
	const blob = JSON.stringify(gdpr);
	expect(blob).toContain("edpb.europa.eu/about-edpb/about-edpb/members_en");
	expect(blob).toContain("supervisory authority");
	expect(blob).not.toContain("your local data protection authority");
});

test("gdpr-supplement does not mention Article 27 representative when unset", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
	});
	const gdpr = doc.sections.find((s) => s.id === "gdpr-supplement")!;
	const blob = JSON.stringify(gdpr);
	expect(blob).not.toContain("Article 27");
	expect(blob).not.toContain("representative in the European Union");
});

test("gdpr-supplement renders Article 27 representative paragraph when configured", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		company: {
			...minimalPrivacyConfig.company,
			euRepresentative: {
				name: "Acme EU Ltd.",
				address: "1 Rue de la Loi, Brussels",
				email: "eu-rep@acme.com",
			},
		},
	});
	const gdpr = doc.sections.find((s) => s.id === "gdpr-supplement")!;
	const blob = JSON.stringify(gdpr);
	expect(blob).toContain("Article 27 GDPR");
	expect(blob).toContain("Acme EU Ltd.");
	expect(blob).toContain("1 Rue de la Loi, Brussels");
	expect(blob).toContain("eu-rep@acme.com");
});

test("gdpr-supplement names specific Article 46 transfer safeguards and links the adequacy registry", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
	});
	const gdpr = doc.sections.find((s) => s.id === "gdpr-supplement")!;
	const blob = JSON.stringify(gdpr);
	expect(blob).toContain("Chapter V");
	expect(blob).toContain("Standard Contractual Clauses");
	expect(blob).toContain("Binding Corporate Rules");
	expect(blob).toContain("adequate level of data protection");
	expect(blob).toContain(
		"commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en",
	);
	expect(blob).toContain(minimalPrivacyConfig.company.contact.email);
	expect(blob).not.toContain("we ensure adequate safeguards are in place");
});

test("uk-gdpr-supplement still names the ICO with its complaint URL", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["uk"],
	});
	const uk = doc.sections.find((s) => s.id === "uk-gdpr-supplement")!;
	const blob = JSON.stringify(uk);
	expect(blob).toContain("Information Commissioner");
	expect(blob).toContain("ico.org.uk/make-a-complaint");
});

test("provision-requirement section renders one paragraph per category covering each basis (EU)", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		data: {
			collected: {
				"Account Information": ["Email"],
				"Billing Address": ["Street", "City"],
				"Marketing Preferences": ["Newsletter opt-in"],
				"Cover Letter": ["Free-text"],
			},
			context: {
				"Account Information": {
					purpose: "To authenticate users",
					lawfulBasis: "contract",
					retention: "Until account deletion",
					provision: {
						basis: "contractual",
						consequences: "We cannot operate your account.",
					},
				},
				"Billing Address": {
					purpose: "To issue invoices",
					lawfulBasis: "legal_obligation",
					retention: "7 years",
					provision: {
						basis: "statutory",
						consequences: "We cannot lawfully invoice you.",
					},
				},
				"Marketing Preferences": {
					purpose: "To send marketing emails",
					lawfulBasis: "consent",
					retention: "Until consent is withdrawn",
					provision: {
						basis: "voluntary",
						consequences: "None — you may decline without affecting your service.",
					},
				},
				"Cover Letter": {
					purpose: "To enter into an employment contract",
					lawfulBasis: "contract",
					retention: "12 months",
					provision: {
						basis: "contract-prerequisite",
						consequences: "We cannot consider your application.",
					},
				},
			},
		},
	});
	const pr = doc.sections.find((s) => s.id === "provision-requirement")!;
	expect(pr).toBeDefined();
	const blob = JSON.stringify(pr);
	expect(blob).toContain("Article 13(2)(e)");
	expect(blob).toContain("Required by law");
	expect(blob).toContain("Required under our contract with you");
	expect(blob).toContain("Required to enter into a contract");
	expect(blob).toContain("Voluntary");
	expect(blob).toContain("We cannot operate your account.");
	expect(blob).toContain("We cannot lawfully invoice you.");
	expect(blob).toContain("We cannot consider your application.");
	expect(blob).toContain("Consequences");
});

test("provision-requirement section is omitted under non-EU/UK jurisdictions", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["us-ca"],
	});
	expect(doc.sections.find((s) => s.id === "provision-requirement")).toBeUndefined();
});

test("provision-requirement section is rendered under UK jurisdiction", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["uk"],
	});
	expect(doc.sections.find((s) => s.id === "provision-requirement")).toBeDefined();
});

test("automated-decision-making section enumerates each activity and appends Art. 22 right-to-human-review", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["eea"],
		automatedDecisionMaking: [
			{
				name: "Fraud scoring",
				logic:
					"Transactions are scored by a rules engine combining device fingerprint and transaction history.",
				significance:
					"A high score may delay or decline a transaction; you can request human review.",
			},
		],
	});
	const adm = doc.sections.find((s) => s.id === "automated-decision-making")!;
	expect(adm).toBeDefined();
	const blob = JSON.stringify(adm);
	expect(blob).toContain("Fraud scoring");
	expect(blob).toContain("rules engine");
	expect(blob).toContain("Significance");
	expect(blob).toContain("Right to human review");
	expect(blob).toContain(minimalPrivacyConfig.company.contact.email);
});

test("Contact section renders phone when company.contact.phone is set", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		company: {
			...minimalPrivacyConfig.company,
			contact: { email: "privacy@acme.com", phone: "+1-800-555-0100" },
		},
	});
	const contact = doc.sections.find((s) => s.id === "contact")!;
	expect(contact).toBeDefined();
	const blob = JSON.stringify(contact);
	expect(blob).toContain("Phone:");
	expect(blob).toContain("+1-800-555-0100");
});

test("Contact section omits phone when company.contact.phone is unset", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	const contact = doc.sections.find((s) => s.id === "contact")!;
	const blob = JSON.stringify(contact);
	expect(blob).not.toContain("Phone:");
});

test("CCPA supplement renders Submitting Requests with email and phone when us-ca", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["us-ca"],
		company: {
			...minimalPrivacyConfig.company,
			contact: { email: "privacy@acme.com", phone: "+1-800-555-0100" },
		},
	});
	const ccpa = doc.sections.find((s) => s.id === "ccpa-supplement")!;
	expect(ccpa).toBeDefined();
	const blob = JSON.stringify(ccpa);
	expect(blob).toContain("Submitting requests");
	expect(blob).toContain("privacy@acme.com");
	expect(blob).toContain("+1-800-555-0100");
});

test("CCPA supplement Submitting Requests lists email even when phone is unset", () => {
	const doc = privacy({
		...minimalPrivacyConfig,
		jurisdictions: ["us-ca"],
	});
	const ccpa = doc.sections.find((s) => s.id === "ccpa-supplement")!;
	const blob = JSON.stringify(ccpa);
	expect(blob).toContain("Submitting requests");
	expect(blob).toContain("privacy@acme.com");
});

test("CCPA supplement is omitted when us-ca is not in jurisdictions", () => {
	const doc = privacy({ ...minimalPrivacyConfig });
	expect(doc.sections.find((s) => s.id === "ccpa-supplement")).toBeUndefined();
});
