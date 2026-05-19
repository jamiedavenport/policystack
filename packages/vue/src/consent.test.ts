// @vitest-environment happy-dom
import type { PolicyStackConfig } from "@policystack/core";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { ConsentGate, type ConsentExpr, useCategory, useConsent } from "./consent";
import { PolicyStack } from "./provider";

// Cookie posture that derives to the same three categories the old hand-rolled
// `baseCategories` array used: essential (locked, legal obligation), analytics
// and marketing (consent-gated).
const policyConfig: PolicyStackConfig = {
	company: {
		name: "Acme Inc.",
		legalName: "Acme Corporation",
		address: "123 Main St, Springfield, USA",
		contact: { email: "privacy@acme.com" },
	},
	effectiveDate: "2026-01-01",
	jurisdictions: ["eea"],
	data: { collected: {}, context: {} },
	cookies: {
		used: { essential: true, analytics: true, marketing: true },
		context: {
			essential: { lawfulBasis: "legal_obligation" },
			analytics: { lawfulBasis: "consent" },
			marketing: { lawfulBasis: "consent" },
		},
	},
};

afterEach(() => {
	vi.restoreAllMocks();
});

// Mounts `setupFn` inside the single <PolicyStack> provider and returns both
// the wrapper and whatever the setup captured.
function withProvider(setupFn: () => unknown) {
	const Inner = defineComponent({ setup: setupFn, render: () => h("div") });
	const wrapper = mount(PolicyStack, {
		props: { config: policyConfig },
		slots: { default: () => h(Inner) },
	});
	return wrapper;
}

describe("consent composables read the single PolicyStack context", () => {
	it("derives the store from the one config", () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		withProvider(() => {
			captured = useConsent();
		});
		expect(captured?.route.value).toBe("cookie");
		expect(captured?.decisions.value).toEqual({
			essential: true,
			analytics: false,
			marketing: false,
		});
	});

	it("throws when used outside <PolicyStack>", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const Probe = defineComponent({
			setup: () => {
				useConsent();
			},
			render: () => h("div"),
		});
		expect(() => mount(Probe)).toThrow(/must be used inside <PolicyStack>/);
	});
});

describe("useConsent", () => {
	it("re-renders consumers when state changes", async () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const Inner = defineComponent({
			setup: () => {
				captured = useConsent();
				return () => h("span", { "data-testid": "route" }, captured?.route.value);
			},
		});
		const wrapper = mount(PolicyStack, {
			props: { config: policyConfig },
			slots: { default: () => h(Inner) },
		});
		expect(wrapper.get('[data-testid="route"]').text()).toBe("cookie");

		captured?.acceptAll();
		await wrapper.vm.$nextTick();
		expect(captured?.route.value).toBe("closed");
		expect(captured?.decisions.value.analytics).toBe(true);
		expect(wrapper.get('[data-testid="route"]').text()).toBe("closed");
	});

	it("toggle and save flow works", async () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const wrapper = withProvider(() => {
			captured = useConsent();
		});
		captured?.toggle("analytics");
		await wrapper.vm.$nextTick();
		expect(captured?.decisions.value.analytics).toBe(true);
		expect(captured?.decidedAt.value).toBeNull();
		captured?.save();
		await wrapper.vm.$nextTick();
		expect(captured?.decidedAt.value).not.toBeNull();
		expect(captured?.route.value).toBe("closed");
	});

	it("setRoute updates the route", async () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const wrapper = withProvider(() => {
			captured = useConsent();
		});
		captured?.setRoute("preferences");
		await wrapper.vm.$nextTick();
		expect(captured?.route.value).toBe("preferences");
	});

	it("getConsentRecord returns null pre-decision and a v1 record after acceptAll", async () => {
		let captured: ReturnType<typeof useConsent> | undefined;
		const wrapper = withProvider(() => {
			captured = useConsent();
		});
		expect(captured?.getConsentRecord()).toBeNull();
		captured?.acceptAll();
		await wrapper.vm.$nextTick();
		const record = captured?.getConsentRecord();
		expect(record).not.toBeNull();
		expect(record?.schemaVersion).toBe(1);
		expect(record?.source).toBe("banner");
	});
});

describe("useCategory", () => {
	it("returns granted false initially for non-locked categories", () => {
		let captured: ReturnType<typeof useCategory> | undefined;
		withProvider(() => {
			captured = useCategory("analytics");
		});
		expect(captured?.granted.value).toBe(false);
	});

	it("returns granted true for locked categories", () => {
		let captured: ReturnType<typeof useCategory> | undefined;
		withProvider(() => {
			captured = useCategory("essential");
		});
		expect(captured?.granted.value).toBe(true);
	});

	it("flips on toggle", async () => {
		let captured: ReturnType<typeof useCategory> | undefined;
		const wrapper = withProvider(() => {
			captured = useCategory("analytics");
		});
		captured?.toggle();
		await wrapper.vm.$nextTick();
		expect(captured?.granted.value).toBe(true);
	});
});

describe("ConsentGate", () => {
	// A controller that captures useConsent so the test can drive the store
	// through the public composable (no separate store handle anymore).
	function mountGate(requires: ConsentExpr) {
		let captured: ReturnType<typeof useConsent> | undefined;
		const Controller = defineComponent({
			setup: () => {
				captured = useConsent();
				return () =>
					h(
						ConsentGate,
						{ requires },
						{
							default: () => h("span", { "data-testid": "child" }, "visible"),
							fallback: () => h("span", { "data-testid": "fb" }, "nope"),
						},
					);
			},
		});
		const wrapper = mount(PolicyStack, {
			props: { config: policyConfig },
			slots: { default: () => h(Controller) },
		});
		return { wrapper, get: () => captured };
	}

	it("renders default slot when expression is true", async () => {
		const { wrapper, get } = mountGate("analytics");
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		get()?.acceptAll();
		await wrapper.vm.$nextTick();
		expect(wrapper.get('[data-testid="child"]').text()).toBe("visible");
	});

	it("renders fallback slot when expression is false", () => {
		const { wrapper } = mountGate("analytics");
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		expect(wrapper.get('[data-testid="fb"]').text()).toBe("nope");
	});

	it("renders nothing when no fallback and gate is closed", () => {
		const Controller = defineComponent({
			setup: () => () =>
				h(
					ConsentGate,
					{ requires: "analytics" },
					{ default: () => h("span", { "data-testid": "child" }, "visible") },
				),
		});
		const wrapper = mount(PolicyStack, {
			props: { config: policyConfig },
			slots: { default: () => h(Controller) },
		});
		expect(wrapper.text()).toBe("");
	});

	it("updates when state crosses the truth boundary", async () => {
		const { wrapper, get } = mountGate("analytics");
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		get()?.toggle("analytics");
		await wrapper.vm.$nextTick();
		expect(wrapper.get('[data-testid="child"]').text()).toBe("visible");
		expect(wrapper.find('[data-testid="fb"]').exists()).toBe(false);
	});

	it("evaluates compound expressions", async () => {
		const { wrapper, get } = mountGate({ and: ["analytics", "marketing"] });
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		get()?.toggle("analytics");
		await wrapper.vm.$nextTick();
		expect(wrapper.find('[data-testid="child"]').exists()).toBe(false);
		get()?.toggle("marketing");
		await wrapper.vm.$nextTick();
		expect(wrapper.get('[data-testid="child"]').text()).toBe("visible");
	});
});
