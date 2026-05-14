import type { PrivacyPolicyConfig } from "@openpolicy/core";
import { compile } from "@openpolicy/core";
import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { PrivacyPolicy, renderDocument } from ".";
import type { PolicyComponents } from "./types";

const company = {
	name: "Acme",
	legalName: "Acme Inc.",
	address: "123 Main St",
	contact: { email: "privacy@acme.com" },
};

const privacyConfig: PrivacyPolicyConfig = {
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
	userRights: ["access", "erasure"],
	jurisdictions: ["ca"],
};

test("renderDocument returns a React element", () => {
	const doc = compile({ type: "privacy", ...privacyConfig });
	const result = renderDocument(doc);
	expect(isValidElement(result)).toBe(true);
});

test("renderDocument works with OpenPolicyConfig via compile", () => {
	const doc = compile({ type: "privacy", ...privacyConfig });
	const result = renderDocument(doc);
	expect(result).toBeTruthy();
});

test("PrivacyPolicy renders default DOM tags when no components are passed", () => {
	const html = renderToStaticMarkup(<PrivacyPolicy config={privacyConfig} />);
	expect(html).toContain("data-op-policy");
	expect(html).toMatch(/<section\b/);
	expect(html).toMatch(/<h\d\b/);
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
	TableHeader: Slot("tableHeader"),
	TableBody: Slot("tableBody"),
	TableRow: Slot("tableRow"),
	TableHead: Slot("tableHead"),
	TableCell: Slot("tableCell"),
	Text: Empty("text"),
	Bold: Empty("bold"),
	Italic: Empty("italic"),
	Link: Empty("link"),
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
	const doc = compile({ type: "privacy", ...privacyConfig });
	const html = renderToStaticMarkup(<>{renderDocument(doc, rnLikeComponents)}</>);
	expect(html).not.toMatch(forbiddenTagPattern);
});
