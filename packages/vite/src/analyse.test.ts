import { expect, test } from "vite-plus/test";
import { extractFromFile, extractFromParsed, parseModule } from "./analyse";
import { isCanonicalSdkSpecifier, type SdkSpecifierMatcher } from "./sdk-specifier";

// ---------------------------------------------------------------------------
// collecting() tests
// ---------------------------------------------------------------------------

test("canonical case: string literal values in object literal", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting("Account Information", { name, email }, {
			name: "Name",
			email: "Email address",
		});
	`;
	expect(extractFromFile("a.ts", code).dataCollected).toEqual({
		"Account Information": ["Name", "Email address"],
	});
});

test("renamed import", () => {
	const code = `
		import { collecting as col } from "@openpolicy/sdk";
		col("Cat", v, { a: "Name" });
	`;
	expect(extractFromFile("a.ts", code).dataCollected).toEqual({
		Cat: ["Name"],
	});
});

test("ignores collecting imported from a non-SDK module", () => {
	const code = `
		import { collecting } from "./local-collecting";
		collecting("Cat", v, { a: "Name" });
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({});
	// Not a recognized call — must stay silent (scope boundary).
	expect(result.diagnostics).toEqual([]);
});

test("ignores local `collecting` not imported from anywhere", () => {
	const code = `
		function collecting(a, b, c) { return b; }
		collecting("Cat", v, { a: "Name" });
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({});
	expect(result.diagnostics).toEqual([]);
});

test("ignores type-only imports", () => {
	const code = `
		import type { collecting } from "@openpolicy/sdk";
		collecting("Cat", v, { a: "Name" });
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({});
	expect(result.diagnostics).toEqual([]);
});

test("template-literal category is dropped with a located diagnostic", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting(\`Cat\`, v, { a: "Name" });
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({});
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "collecting() category must be a string literal",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("non-string label values diagnosed individually, string values kept", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting("Cat", v, { a: 42, b: "Kept", c: true });
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ Cat: ["Kept"] });
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-label-value",
			message: 'collecting() label "a" value must be a string literal or Ignore',
			file: "a.ts",
			line: 3,
			column: 3,
		},
		{
			code: "non-literal-label-value",
			message: 'collecting() label "c" value must be a string literal or Ignore',
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("spread in the label object is dropped with a diagnostic, string values kept", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		const rest = {};
		collecting("Cat", v, { ...rest, b: "Kept" });
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ Cat: ["Kept"] });
	expect(result.diagnostics).toEqual([
		{
			code: "spread-in-label-map",
			message: "collecting() label object uses a spread; spread labels can't be read statically",
			file: "a.ts",
			line: 4,
			column: 3,
		},
	]);
});

test("malformed source returns empty without throwing", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting("Cat", v, { a: "Name"
	`;
	const originalWarn = console.warn;
	console.warn = () => {}; // suppress expected parse-error log
	try {
		expect(() => extractFromFile("a.ts", code)).not.toThrow();
		// Parser still produces a partial AST that may or may not contain the
		// call, but the function must never throw and must return an object.
		const out = extractFromFile("a.ts", code);
		expect(typeof out).toBe("object");
	} finally {
		console.warn = originalWarn;
	}
});

test("merges multiple calls with the same category", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting("Cat", v, { a: "A" });
		collecting("Cat", w, { b: "B", a2: "A" });
	`;
	expect(extractFromFile("a.ts", code).dataCollected).toEqual({
		Cat: ["A", "B"],
	});
});

test("deduplicates repeated label values — intentional dedup, no diagnostic", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting("Cat", v, { a: "A", a2: "A" });
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ Cat: ["A"] });
	expect(result.diagnostics).toEqual([]);
});

test("collecting with fewer than three arguments is diagnosed", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting("Cat", v);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({});
	expect(result.diagnostics).toEqual([
		{
			code: "missing-arguments",
			message: "collecting() requires 3 arguments (category, value, labels)",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("collecting whose third arg is a variable reference is diagnosed", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		const labels = { a: "Name" };
		collecting("Cat", v, labels);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({});
	expect(result.diagnostics).toEqual([
		{
			code: "non-object-label-map",
			message: "collecting() labels (3rd argument) must be an object literal",
			file: "a.ts",
			line: 4,
			column: 3,
		},
	]);
});

test("collecting whose third arg is an arrow function is diagnosed", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		collecting("Cat", v, (v) => ({ Name: v.a }));
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({});
	expect(result.diagnostics).toEqual([
		{
			code: "non-object-label-map",
			message: "collecting() labels (3rd argument) must be an object literal",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("empty source returns empty", () => {
	const result = extractFromFile("a.ts", "");
	expect(result.dataCollected).toEqual({});
	expect(result.thirdParties).toEqual([]);
});

test("Ignore sentinel omits the field, keeps other labels, emits no diagnostic", () => {
	const code = `
		import { collecting, Ignore } from "@openpolicy/sdk";
		collecting("Account Information", { name, hashedPassword }, {
			name: "Name",
			hashedPassword: Ignore,
		});
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ "Account Information": ["Name"] });
	// Ignore is an explicit, intentional opt-out — not data loss.
	expect(result.diagnostics).toEqual([]);
});

test("Ignore recognised under a renamed import emits no diagnostic", () => {
	const code = `
		import { collecting, Ignore as Skip } from "@openpolicy/sdk";
		collecting("Cat", v, {
			a: "Name",
			b: Skip,
		});
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ Cat: ["Name"] });
	expect(result.diagnostics).toEqual([]);
});

test("Ignore imported from a non-SDK module is diagnosed (not the sentinel)", () => {
	// The local `Ignore` here is unrelated to the SDK sentinel, so its value
	// is genuinely unreadable — that's ambiguous data loss and must surface a
	// located diagnostic rather than vanish.
	const code = `
		import { collecting } from "@openpolicy/sdk";
		import { Ignore } from "./somewhere-else";
		collecting("Cat", v, {
			a: "Name",
			b: Ignore,
		});
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ Cat: ["Name"] });
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-label-value",
			message: 'collecting() label "b" value must be a string literal or Ignore',
			file: "a.ts",
			line: 4,
			column: 3,
		},
	]);
});

test("all properties marked Ignore yields an empty label array, no diagnostic", () => {
	const code = `
		import { collecting, Ignore } from "@openpolicy/sdk";
		collecting("Cat", v, {
			a: Ignore,
			b: Ignore,
		});
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ Cat: [] });
	expect(result.diagnostics).toEqual([]);
});

test("calls nested inside other functions are still extracted", () => {
	const code = `
		import { collecting } from "@openpolicy/sdk";
		export function createUser(name: string, email: string) {
			return db.insert(users).values(
				collecting("Account Information", { name, email }, {
					name: "Name",
					email: "Email address",
				}),
			);
		}
	`;
	expect(extractFromFile("a.ts", code).dataCollected).toEqual({
		"Account Information": ["Name", "Email address"],
	});
});

// ---------------------------------------------------------------------------
// thirdParty() tests
// ---------------------------------------------------------------------------

test("thirdParty: canonical case with 3 string literal args", () => {
	const code = `
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
	`;
	expect(extractFromFile("a.ts", code).thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
});

test("thirdParty: renamed import", () => {
	const code = `
		import { thirdParty as tp } from "@openpolicy/sdk";
		tp("Stripe", "Payments", "https://stripe.com/privacy");
	`;
	expect(extractFromFile("a.ts", code).thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
});

test("thirdParty: ignored if imported from non-SDK module", () => {
	const code = `
		import { thirdParty } from "./local-third-party";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
	`;
	expect(extractFromFile("a.ts", code).thirdParties).toEqual([]);
});

test("thirdParty with fewer than 3 args is diagnosed", () => {
	const code = `
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments");
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.thirdParties).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "missing-arguments",
			message: "thirdParty() requires 3 arguments (name, purpose, policyUrl)",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("thirdParty with a non-literal name is diagnosed", () => {
	const code = `
		import { thirdParty } from "@openpolicy/sdk";
		const name = "Stripe";
		thirdParty(name, "Payments", "https://stripe.com/privacy");
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.thirdParties).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "thirdParty() name must be a string literal",
			file: "a.ts",
			line: 4,
			column: 3,
		},
	]);
});

test("thirdParty with a non-literal purpose is diagnosed", () => {
	const code = `
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", getPurpose(), "https://stripe.com/privacy");
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.thirdParties).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "thirdParty() purpose must be a string literal",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("thirdParty with a non-literal policyUrl is diagnosed", () => {
	const code = `
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", STRIPE_POLICY_URL);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.thirdParties).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "thirdParty() policyUrl must be a string literal",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("thirdParty: deduplication — same name in same file appears once, no diagnostic", () => {
	const code = `
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		thirdParty("Stripe", "Billing", "https://stripe.com/other");
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
	// Within-file duplicate is intentional dedup, not data loss.
	expect(result.diagnostics).toEqual([]);
});

test("thirdParty: multiple distinct entries", () => {
	const code = `
		import { thirdParty } from "@openpolicy/sdk";
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		thirdParty("Sentry", "Error tracking", "https://sentry.io/privacy");
	`;
	expect(extractFromFile("a.ts", code).thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
		{
			name: "Sentry",
			purpose: "Error tracking",
			policyUrl: "https://sentry.io/privacy",
		},
	]);
});

test("collecting and thirdParty can coexist in the same file", () => {
	const code = `
		import { collecting, thirdParty } from "@openpolicy/sdk";
		collecting("Account Information", v, { name: "Name" });
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.dataCollected).toEqual({ "Account Information": ["Name"] });
	expect(result.thirdParties).toEqual([
		{
			name: "Stripe",
			purpose: "Payments",
			policyUrl: "https://stripe.com/privacy",
		},
	]);
});

// ---------------------------------------------------------------------------
// cookie detection tests
// ---------------------------------------------------------------------------

test("defineCookie: string literal category is collected", () => {
	const code = `
		import { defineCookie } from "@openpolicy/sdk";
		defineCookie("analytics");
	`;
	expect(extractFromFile("a.ts", code).cookies).toEqual(["analytics"]);
});

test("defineCookie: multiple distinct categories collected in insertion order", () => {
	const code = `
		import { defineCookie } from "@openpolicy/sdk";
		defineCookie("analytics");
		defineCookie("marketing");
	`;
	expect(extractFromFile("a.ts", code).cookies).toEqual(["analytics", "marketing"]);
});

test("defineCookie: duplicate categories deduped, no diagnostic", () => {
	const code = `
		import { defineCookie } from "@openpolicy/sdk";
		defineCookie("analytics");
		defineCookie("analytics");
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.cookies).toEqual(["analytics"]);
	expect(result.diagnostics).toEqual([]);
});

test("defineCookie: renamed import recognised", () => {
	const code = `
		import { defineCookie as dc } from "@openpolicy/sdk";
		dc("functional");
	`;
	expect(extractFromFile("a.ts", code).cookies).toEqual(["functional"]);
});

test("defineCookie: ignored if imported from non-SDK module", () => {
	const code = `
		import { defineCookie } from "./local-define-cookie";
		defineCookie("analytics");
	`;
	expect(extractFromFile("a.ts", code).cookies).toEqual([]);
});

test("defineCookie: ignored for type-only imports", () => {
	const code = `
		import type { defineCookie } from "@openpolicy/sdk";
		defineCookie("analytics");
	`;
	expect(extractFromFile("a.ts", code).cookies).toEqual([]);
});

test("defineCookie with a non-literal argument is diagnosed", () => {
	const code = `
		import { defineCookie } from "@openpolicy/sdk";
		const cat = "analytics";
		defineCookie(cat);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.cookies).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "defineCookie() category must be a string literal",
			file: "a.ts",
			line: 4,
			column: 3,
		},
	]);
});

test("cookies + collecting + thirdParty coexist in one file", () => {
	const code = `
		import { collecting, thirdParty, defineCookie } from "@openpolicy/sdk";
		collecting("Account Information", v, { name: "Name" });
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		defineCookie("analytics");
		defineCookie("marketing");
	`;
	const result = extractFromFile("a.tsx", code);
	expect(result.dataCollected).toEqual({ "Account Information": ["Name"] });
	expect(result.thirdParties).toHaveLength(1);
	expect(result.cookies.sort()).toEqual(["analytics", "marketing"]);
	expect(result.diagnostics).toEqual([]);
});

// ---------------------------------------------------------------------------
// sharing() — data-egress edge detection
// ---------------------------------------------------------------------------

test("sharing: canonical case with 2 string literals + a value", () => {
	const code = `
		import { sharing } from "@openpolicy/sdk";
		sharing("Account Information", "Stripe", { email });
	`;
	expect(extractFromFile("a.ts", code).sharing).toEqual([
		{ key: "Account Information", recipient: "Stripe" },
	]);
});

test("sharing: renamed import", () => {
	const code = `
		import { sharing as shareWith } from "@openpolicy/sdk";
		shareWith("Usage Data", "PostHog", payload);
	`;
	expect(extractFromFile("a.ts", code).sharing).toEqual([
		{ key: "Usage Data", recipient: "PostHog" },
	]);
});

test("sharing: ignored if imported from non-SDK module", () => {
	const code = `
		import { sharing } from "./local-sharing";
		sharing("Account Information", "Stripe", v);
	`;
	expect(extractFromFile("a.ts", code).sharing).toEqual([]);
});

test("sharing: ignored for type-only imports", () => {
	const code = `
		import type { sharing } from "@openpolicy/sdk";
		sharing("Account Information", "Stripe", v);
	`;
	expect(extractFromFile("a.ts", code).sharing).toEqual([]);
});

test("sharing with fewer than 3 args is diagnosed", () => {
	const code = `
		import { sharing } from "@openpolicy/sdk";
		sharing("Account Information", "Stripe");
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.sharing).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "missing-arguments",
			message: "sharing() requires 3 arguments (key, recipient, value)",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("sharing with a non-literal key is diagnosed", () => {
	const code = `
		import { sharing } from "@openpolicy/sdk";
		const key = "Account Information";
		sharing(key, "Stripe", v);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.sharing).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "sharing() key must be a string literal",
			file: "a.ts",
			line: 4,
			column: 3,
		},
	]);
});

test("sharing with a non-literal recipient is diagnosed", () => {
	const code = `
		import { sharing } from "@openpolicy/sdk";
		sharing("Account Information", getRecipient(), v);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.sharing).toEqual([]);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "sharing() recipient must be a string literal",
			file: "a.ts",
			line: 3,
			column: 3,
		},
	]);
});

test("sharing: the value argument is never scanned and never diagnosed", () => {
	const code = `
		import { sharing } from "@openpolicy/sdk";
		sharing("Account Information", "Stripe", buildPayload(user, opts));
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.sharing).toEqual([{ key: "Account Information", recipient: "Stripe" }]);
	expect(result.diagnostics).toEqual([]);
});

test("sharing: identical (key, recipient) in same file appears once, no diagnostic", () => {
	const code = `
		import { sharing } from "@openpolicy/sdk";
		sharing("Account Information", "Stripe", a);
		sharing("Account Information", "Stripe", b);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.sharing).toEqual([{ key: "Account Information", recipient: "Stripe" }]);
	// Within-file duplicate edge is intentional dedup, not data loss.
	expect(result.diagnostics).toEqual([]);
});

test("sharing: same key to different recipients are distinct edges", () => {
	const code = `
		import { sharing } from "@openpolicy/sdk";
		sharing("Usage Data", "PostHog", a);
		sharing("Usage Data", "Stripe", b);
	`;
	expect(extractFromFile("a.ts", code).sharing).toEqual([
		{ key: "Usage Data", recipient: "PostHog" },
		{ key: "Usage Data", recipient: "Stripe" },
	]);
});

test("all four call-site helpers coexist in one file", () => {
	const code = `
		import { collecting, thirdParty, defineCookie, sharing } from "@openpolicy/sdk";
		collecting("Account Information", v, { name: "Name" });
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		defineCookie("analytics");
		sharing("Account Information", "Stripe", v);
	`;
	const result = extractFromFile("a.tsx", code);
	expect(result.dataCollected).toEqual({ "Account Information": ["Name"] });
	expect(result.thirdParties).toHaveLength(1);
	expect(result.cookies).toEqual(["analytics"]);
	expect(result.sharing).toEqual([{ key: "Account Information", recipient: "Stripe" }]);
	expect(result.diagnostics).toEqual([]);
});

// ---------------------------------------------------------------------------
// diagnostic location + aggregation
// ---------------------------------------------------------------------------

test("diagnostic location is the 1-based line:column of the call expression", () => {
	// Built without a leading newline so the line/column math is unambiguous:
	// line 1 = import, line 2 = const, line 3 = the call indented 3 spaces.
	const code =
		'import { collecting } from "@openpolicy/sdk";\n' +
		"const x = 1;\n" +
		'   collecting(cat, v, { a: "Name" });\n';
	const result = extractFromFile("src/x.ts", code);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "collecting() category must be a string literal",
			file: "src/x.ts",
			line: 3,
			column: 4,
		},
	]);
});

test("canonical valid calls produce zero diagnostics", () => {
	const code = `
		import { collecting, thirdParty, defineCookie } from "@openpolicy/sdk";
		collecting("Account Information", { name }, { name: "Name" });
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
		defineCookie("analytics");
	`;
	expect(extractFromFile("a.ts", code).diagnostics).toEqual([]);
});

test("multiple skipped calls each produce their own located diagnostic", () => {
	const code = `
		import { collecting, defineCookie } from "@openpolicy/sdk";
		collecting(catA, v, { a: "Name" });
		defineCookie(catB);
	`;
	const result = extractFromFile("a.ts", code);
	expect(result.diagnostics).toEqual([
		{
			code: "non-literal-argument",
			message: "collecting() category must be a string literal",
			file: "a.ts",
			line: 3,
			column: 3,
		},
		{
			code: "non-literal-argument",
			message: "defineCookie() category must be a string literal",
			file: "a.ts",
			line: 4,
			column: 3,
		},
	]);
});

// ---------------------------------------------------------------------------
// SDK specifier predicate (PS-8)
// ---------------------------------------------------------------------------

test("default predicate recognises the @policystack/sdk scope (rename window)", () => {
	const code = `
		import { collecting } from "@policystack/sdk";
		collecting("Account Information", v, { email: "Email address" });
	`;
	expect(extractFromFile("a.ts", code).dataCollected).toEqual({
		"Account Information": ["Email address"],
	});
});

test("default predicate recognises a renamed import from @policystack/sdk", () => {
	const code = `
		import { collecting as col } from "@policystack/sdk";
		col("Contact", v, { phone: "Phone number" });
	`;
	expect(extractFromFile("a.ts", code).dataCollected).toEqual({
		Contact: ["Phone number"],
	});
});

test("an injected predicate makes an aliased specifier collectable", () => {
	const code = `
		import { collecting } from "#sdk";
		collecting("Account Information", v, { email: "Email address" });
	`;
	const aliasMatcher: SdkSpecifierMatcher = (s) => s === "#sdk";
	expect(extractFromFile("a.ts", code, aliasMatcher).dataCollected).toEqual({
		"Account Information": ["Email address"],
	});
	// The default (canonical) predicate must NOT match the alias.
	expect(extractFromFile("a.ts", code).dataCollected).toEqual({});
});

test("parseModule + extractFromParsed equals extractFromFile (single-parse seam)", () => {
	const code = `
		import { collecting, thirdParty } from "@openpolicy/sdk";
		collecting("Account Information", v, { email: "Email" });
		thirdParty("Stripe", "Payments", "https://stripe.com/privacy");
	`;
	const parsed = parseModule("a.ts", code);
	expect(parsed).not.toBeNull();
	if (!parsed) return;
	expect(parsed.importSources).toEqual(["@openpolicy/sdk"]);
	expect(extractFromParsed(parsed, isCanonicalSdkSpecifier)).toEqual(extractFromFile("a.ts", code));
});

test("parseModule skips type-only import sources", () => {
	const code = `
		import type { PolicyConfig } from "@openpolicy/core";
		import { collecting } from "@openpolicy/sdk";
		collecting("C", v, { a: "A" });
	`;
	const parsed = parseModule("a.ts", code);
	expect(parsed?.importSources).toEqual(["@openpolicy/sdk"]);
});

test("parseModule returns null on a hard parse failure", () => {
	expect(parseModule("a.ts", "import { from 'broken")).toBeNull();
});
