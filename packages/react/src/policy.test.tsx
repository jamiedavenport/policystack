import type { Document, PolicyStackConfig, SlotName } from "@policystack/core";
import { compilePrivacyPolicy } from "@policystack/core";
import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { PrivacyPolicy, renderDocument } from "./policy";
import type { PolicyComponents } from "./types";

const company = {
	name: "Acme",
	legalName: "Acme Inc.",
	address: "123 Main St",
	contact: { email: "privacy@acme.com" },
};

const privacyConfig: PolicyStackConfig = {
	effectiveDate: "2026-01-01",
	locale: "en",
	company,
	data: {
		collected: { account: ["email", "name"] },
		context: {
			account: {
				purpose: "To authenticate users",
				lawfulBasis: "contract",
				retention: "2 years",
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

function privacyDoc(): Document {
	const doc = compilePrivacyPolicy(privacyConfig);
	if (!doc) throw new Error("expected a privacy document");
	return doc;
}

test("renderDocument returns a React element", () => {
	const doc = privacyDoc();
	const result = renderDocument(doc);
	expect(isValidElement(result)).toBe(true);
});

test("renderDocument works with PolicyStackConfig via compile", () => {
	const doc = privacyDoc();
	const result = renderDocument(doc);
	expect(result).toBeTruthy();
});

test("PrivacyPolicy renders default DOM tags when no components are passed", () => {
	const html = renderToStaticMarkup(<PrivacyPolicy config={privacyConfig} />);
	expect(html).toContain("data-op-policy");
	expect(html).toMatch(/<section\b/);
	expect(html).toMatch(/<h\d\b/);
});

test("PrivacyPolicy renders French when locale prop overrides config.locale", () => {
	const html = renderToStaticMarkup(<PrivacyPolicy config={privacyConfig} locale="fr" />);
	expect(html).toContain("La présente politique de confidentialité");
	expect(html).not.toContain("This Privacy Policy describes how");
});

const Slot =
	(name: string) =>
	({ children }: { children?: ReactNode }) => <data data-stub={name}>{children}</data>;

const Empty = (name: string) => () => <data data-stub={name} />;

const rnLikeComponents: PolicyComponents = {
	Root: Slot("root"),
	Section: Slot("section"),
	Heading: Empty("heading"),
	Paragraph: Slot("paragraph"),
	List: Slot("list"),
	ListItem: Slot("listItem"),
	Table: Slot("table"),
	TableHeaderRow: Slot("tableHeaderRow"),
	TableHeaderCell: Slot("tableHeaderCell"),
	TableRow: Slot("tableRow"),
	TableCell: Slot("tableCell"),
	Text: Empty("text"),
	Bold: Empty("bold"),
	Italic: Empty("italic"),
	Link: Empty("link"),
	Unknown: Empty("unknown"),
};

const forbiddenTagPattern =
	/<(div|p|li|ol|ul|section|h[1-6]|strong|em|a|table|thead|tbody|tr|td|th)\b/i;

test("PrivacyPolicy with full overrides emits no host DOM tags", () => {
	const html = renderToStaticMarkup(
		<PrivacyPolicy config={privacyConfig} components={rnLikeComponents} />,
	);
	expect(html).not.toMatch(forbiddenTagPattern);
	expect(html).toContain('data-stub="root"');
	expect(html).toContain('data-stub="listItem"');
});

test("renderDocument with full overrides emits no host DOM tags", () => {
	const doc = privacyDoc();
	const html = renderToStaticMarkup(<>{renderDocument(doc, rnLikeComponents)}</>);
	expect(html).not.toMatch(forbiddenTagPattern);
});

// PS-15 (§2.4) drift guard: the React override map must expose exactly the
// canonical slot set from `@policystack/core` — no more, no less. If this
// framework's keys ever diverge, `_keysAreCanonical` collapses to `never` and
// `vp check` fails.
type KeysAreCanonical = [keyof PolicyComponents] extends [SlotName]
	? [SlotName] extends [keyof PolicyComponents]
		? true
		: never
	: never;
const _keysAreCanonical: KeysAreCanonical = true;
void _keysAreCanonical;
