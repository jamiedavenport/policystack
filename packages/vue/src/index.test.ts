import {
	compile,
	type HeadingNode,
	type PrivacyPolicyConfig,
	type SlotName,
} from "@openpolicy/core";
import { expect, test } from "vite-plus/test";
import { defineComponent, h, isVNode, type PropType } from "vue";
import { type PolicyComponents, renderDocument } from ".";

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

test("renderDocument returns Vue VNodes", () => {
	const doc = compile({ type: "privacy", ...privacyConfig });
	const result = renderDocument(doc);
	expect(Array.isArray(result)).toBe(true);
	if (!Array.isArray(result)) throw new Error("Expected array result");
	expect(result.length).toBeGreaterThan(0);
	expect(isVNode(result[0])).toBe(true);
});

test("renderDocument works with OpenPolicyConfig via compile", () => {
	const doc = compile({ type: "privacy", ...privacyConfig });
	const result = renderDocument(doc);
	expect(result).toBeTruthy();
});

test("custom components in PolicyComponents override defaults", () => {
	const CustomHeading = defineComponent({
		name: "CustomHeading",
		props: {
			node: {
				type: Object as PropType<HeadingNode>,
				required: true,
			},
		},
		setup(props) {
			return () => h("div", { "data-custom-heading": "" }, props.node.value);
		},
	});

	const components: PolicyComponents = { Heading: CustomHeading };
	const doc = compile({ type: "privacy", ...privacyConfig });
	const result = renderDocument(doc, components);

	const containsCustomHeading = (value: unknown): boolean => {
		if (!value) return false;
		if (Array.isArray(value)) return value.some(containsCustomHeading);
		if (isVNode(value)) {
			if (value.type === CustomHeading) return true;
			const children = value.children as unknown;
			if (children && typeof children === "object" && "default" in children) {
				const slot = (children as { default?: () => unknown }).default;
				if (typeof slot === "function") return containsCustomHeading(slot());
			}
			return containsCustomHeading(children);
		}
		return false;
	};

	expect(containsCustomHeading(result)).toBe(true);
});

// PS-15 (§2.4) drift guard: the Vue override map must expose exactly the
// canonical slot set from `@openpolicy/core`. If this framework's keys ever
// diverge, `_keysAreCanonical` collapses to `never` and `vp check` fails.
type KeysAreCanonical = [keyof PolicyComponents] extends [SlotName]
	? [SlotName] extends [keyof PolicyComponents]
		? true
		: never
	: never;
const _keysAreCanonical: KeysAreCanonical = true;
void _keysAreCanonical;
